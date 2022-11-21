import Consumo from "./Consumo.js";
import Rendimiento from "./Rendimiento.js";
import Instalacion from "./Instalacion.js";
import Produccion from "./Produccion.js";
import Balance from "./Balance.js";
import Economico from "./Economico.js";

import TCB from "./TCB.js";
import * as UTIL from "./Utiles.js";
import {inicializaEventos} from "./InicializaAplicacion.js"


// Funcion principal para la gestion del flujo de eventos

var optimizacion;
var waitLoop;

export default async function _Dispatch(accion) {
  UTIL.debugLog("Dispatcher recibe: " + accion);
  var status = true;

  switch (accion) {
    case "Inicializa eventos":
      UTIL.debugLog("Dispatch => iniciailizaEventos");
      status = await inicializaEventos();
      if (!status) UTIL.debugLog("Error inicializando eventos");
      return status;

    case "Consumo":
      UTIL.debugLog("Dispatch => _initConsumos");
      status = await _initConsumos(TCB.fuenteConsumos);
      if (!status) UTIL.debugLog("Error creando consumos");
      return status;

    case "Rendimiento":
      UTIL.debugLog("Dispatch => _initRendimiento");
      status = _initRendimiento();
      return status;

    case "Calcular energia":
      optimizacion = true;

      if (!TCB.consumoCreado) {
        alert(i18next.t("dispatcher_MSG_defineConsumosPrimero"));
        return false;
      }

      waitLoop = 0;
      var sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
      document.getElementById('csv_resumen').innerHTML = "PVGIS >"
      while (!TCB.rendimientoCreado && waitLoop++ < 20) {
        document.getElementById('csv_resumen').innerHTML += "<"
        await sleep (1000);
      }
      document.getElementById('csv_resumen').innerHTML = ""

      UTIL.debugLog("Dispatch -> _initInstalacion");
      status = await _initInstalacion(); //await
      if (!status) {
        UTIL.debugLog("Error creando instalación");
        return status;
      }

    case "Produccion":
      UTIL.debugLog("Dispatch -> _initProduccion");
      status = await _initProduccion(); //await
      if (!status) {
        UTIL.debugLog("Error creando producción");
        return status;
      }

    case "Balance":
      UTIL.debugLog("Dispatch -> _initBalance");
      status = _initBalance();
      if (!status) {
        UTIL.debugLog("Error creando balance");
        return status;
      }

      if (optimizacion) {
        optimizacion = false;
        let autoconsumoInicial = TCB.balance.autoconsumo / TCB.produccion.totalAnual;
        let variacion = autoconsumoInicial / 0.5;  //fijamos un objetivo de 50% de autoconsumo
        let panelesOptimos = Math.trunc(TCB.instalacion.paneles * variacion);
        UTIL.debugLog("First pass con " +TCB.instalacion.paneles + 
                " Autoconsumo: " + autoconsumoInicial + 
                " Variacion propuesta " + variacion + 
                " nuevos paneles " + panelesOptimos);
        if (TCB.instalacion.paneles != panelesOptimos) {
          TCB.instalacion.paneles = panelesOptimos;
          document.getElementById("numeroPaneles").value = panelesOptimos;
        }
        //_Dispatch("Produccion");
        status = await _initProduccion();
        status = _initBalance();
      }
      if (TCB.balanceCreado) UTIL.muestraBalanceEnergia();

    case "Economico":
      UTIL.debugLog("Dispatch -> _initEconomico");
      status = await _initEconomico();
      if (!status) {
        UTIL.debugLog("Error creando economico");
        return status;
      }
      if (TCB.economicoCreado) {
        UTIL.muestraBalanceEconomico();
        await muestraBalanceFinanciero();
      }
      return true;

    case "Cambio subvencion":
      UTIL.debugLog("Dispatch -> _cambioSubvencion");
      TCB.economico.calculoFinanciero();
      await muestraBalanceFinanciero();
      return true;

    case "Cambio instalacion":
      UTIL.debugLog("Dispatch -> _cambioInstalacion");
      _cambioInstalacion();
      UTIL.muestraBalanceEnergia();
      UTIL.debugLog("Dispatch -> _initEconomico");
      await _initEconomico();
      if (TCB.economicoCreado) {
        UTIL.muestraBalanceEconomico();
        await muestraBalanceFinanciero();
      }
      return true;
  }
}

// Inicio funciones workflow
// Función de construccion objeto Consumo ---------------------------------------------------------------------------------

async function _initConsumos(desde) {
  //desde puede ser CSV en caso de fichero individual de consumo o REE en caso de perfil REE
  UTIL.debugLog("_initConsumos:" , desde);
  document.getElementById("csv_resumen").innerHTML = TCB.i18next.t('consumo_MSG_cargando');
  if (TCB.consumoCreado) {
    delete TCB.consumo; // Si hay un consumo creado se borra
    TCB.consumoCreado = false;
  }
  var inFile;
  var consumoBase;
  if (desde.fuente === "CSV") {
    const csvFile = document.getElementById("csvfile");
    //Quizas en el futuro permitamos cargar varios ficheros de consumo para bloques o CEs. Por ahora solo 1
    if (csvFile.files.length != 1) {
      alert(i18next.t("proyecto_MSG_definirFicheroConsumo"));
      return false;
    }
    inFile = csvFile.files[0]; // Se carga el fichero de consumo individual desde el CSV definido
    consumoBase = 1;
    UTIL.debugLog("_initConsumo => new consumo de " + inFile.name);
  } else {
    inFile = await UTIL.getFileFromUrl(TCB.basePath + "datos/REE.csv"); //Este es el fichero que contiene los perfiles de consumo (para ambas tarifas) de REE para el último año
    consumoBase = document.getElementById("potenciaAno").value;
    UTIL.debugLog("_initConsumo => new consumo de REE potencia anual: " + consumoBase + " kWh");
  }

  TCB.consumo = new Consumo(inFile, consumoBase);
  await TCB.consumo.loadCSV(desde);
  if (TCB.consumo.numeroRegistros > 0) {
    TCB.consumo.sintesis();
    let consumoMsg = i18next.t('consumo_MSG_resumen', {registros: TCB.consumo.numeroRegistros, 
                              desde: TCB.consumo.fechaInicio.toLocaleDateString(),
                              hasta: TCB.consumo.fechaFin.toLocaleDateString()});
    document.getElementById("csv_resumen").innerHTML = consumoMsg;
    TCB.consumoCreado = true;
    document.getElementById('graf_resumenConsumo').style.display = "block";
    TCB.graficos.consumo_3D("graf_resumenConsumo", "graf_perfilDia");
  } else {
    TCB.consumoCreado = false;
  }
  return TCB.consumoCreado;
}

// Función de construccion objeto Instalacion inicial ----------------------------------------------------------------------
async function _initInstalacion() {

  let tmpPaneles = Math.ceil(TCB.consumo.maximoAnual / TCB.parametros.potenciaPanelInicio); //Para empezar ponemos un panel de potencia definida en TCB defaults
  UTIL.debugLog("_initInstalacion con" + tmpPaneles + " paneles de " + TCB.parametros.potenciaPanelInicio + "kWp");
  TCB.instalacion = new Instalacion(tmpPaneles, TCB.parametros.potenciaPanelInicio); //Creamos una instalación por defecto que cubra el consumo maximo anual
  TCB.instalacionCreada = true;
  return true;

}

// Función de construccion objeto Rendimiento -------------------------------------------------------------------------------
function _initRendimiento() {

  if (TCB.rendimientoCreado) {
    delete TCB.rendimiento; // Si hay rendimiento creado se borra
    TCB.rendimientoCreado = false;
  }

  var inclinacion;
  var azimut;
  var point1;

  // Verificamos posicion en el mapa
  if (document.getElementById("lonlat").value == "") {
    alert(i18next.t("dispatcher_MSG_definePosicionMapa"));
    return false;
  } else {
    point1 = document.getElementById("lonlat").value.split(",");
  }

  // Verificamos inclinación de los paneles
  if (document.getElementById("inclinacionOptima").checked) {
    inclinacion = "Optimo";
  } else {
    inclinacion = document.getElementById("inclinacion").value;
    if (inclinacion.length == 0) {
      alert("Inclinacion?");
      return false;
    }
  }

  // Verificamos orientacion con respecto al sur
  if (document.getElementById("azimutOptima").checked) {
    azimut = "Optimo";
  } else {
    azimut = document.getElementById("azimut").value;
    if (azimut.length == 0) {
      alert("azimut?");
      return false;
    }
  }

  UTIL.debugLog("_initRendimiento -> new rendimiento");
  TCB.rendimiento = new Rendimiento(point1[0], point1[1], inclinacion, azimut);

  //document.getElementById("accionMapa").innerHTML = i18next.t("rendimiento_MSG_obteniendoPVGISdata");
  TCB.rendimiento.loadPVGISdata();
  //document.getElementById("accionMapa").innerHTML = i18next.t("proyecto_LBL_accion_mapa1");
  return true;
}

// Función de construccion objeto Producción -------------------------------------------------------------------------------
async function _initProduccion() {
  if (!TCB.rendimientoCreado) {
    return false;
  }

  if (TCB.produccionCreada) {
    delete TCB.produccion;
    TCB.produccionCreada = false;
  }

  TCB.produccion = new Produccion(TCB.instalacion.potenciaTotal(), TCB.rendimiento);
  TCB.produccionCreada = true;
  return true;
}

// Función de construccion objeto Balance -------------------------------------------------------------------------------
function _initBalance() {
  if (TCB.balanceCreado) {
    delete TCB.balance;
    TCB.balanceCreado = false;
  }
  TCB.balance = new Balance(TCB.produccion, TCB.consumo);
  TCB.balanceCreado = true;

  return true;
}

async function _cambioInstalacion(paneles, potenciaUnitaria) {

  if (paneles === undefined) {
    TCB.instalacion.paneles = document.getElementById("numeroPaneles").value;
  } else {
    TCB.instalacion.paneles = paneles;
  }
  if (potenciaUnitaria === undefined) {
    TCB.instalacion.potenciaUnitaria = document.getElementById("potenciaUnitaria").value;
  } else {
    TCB.instalacion.potenciaUnitaria = potenciaUnitaria;
  }

  if (TCB.produccionCreada) {
    delete TCB.produccion;
    TCB.produccionCreada = false;
  }

  TCB.produccion = new Produccion(
    TCB.instalacion.potenciaTotal(),
    TCB.rendimiento
  );
  TCB.produccionCreada = true;
  if (TCB.balanceCreado) {
    delete TCB.balance;
    TCB.balanceCreado = false;
  }
  TCB.balance = new Balance(TCB.produccion, TCB.consumo);
  TCB.balanceCreado = true;
  return true;
}

// Función de construccion objeto Economico -------------------------------------------------------------------------------
async function _initEconomico() {
  if (TCB.economicoCreado) {
    delete TCB.economico;
    TCB.economicoCreado = false;
  }

  TCB.economico = new Economico();
  TCB.economicoCreado = true;
  return true;
}

async function muestraBalanceFinanciero() {

  var table = document.getElementById("financiero");

  var rowCount = table.rows.length;
  if (rowCount > 1) {
    for (let i = 1; i < rowCount; i++) {
      table.deleteRow(1);
    }
  }

  for (let i = 0; i < TCB.economico.cashFlow.length; i++) {
    var row = table.insertRow(i + 1);

    var cell = row.insertCell(0);
    cell.innerHTML = TCB.economico.cashFlow[i].ano;

    var cell = row.insertCell(1);
    if (TCB.economico.cashFlow[i].previo < 0) cell.classList.add("text-danger");
    cell.innerHTML = UTIL.formatNumber(TCB.economico.cashFlow[i].previo, 2) + "€";

    var cell = row.insertCell(2);
    if (TCB.economico.cashFlow[i].inversion < 0)
      cell.classList.add("text-danger");
    cell.innerHTML = UTIL.formatNumber(TCB.economico.cashFlow[i].inversion, 2) + "€";

    var cell = row.insertCell(3);
    cell.innerHTML = UTIL.formatNumber(TCB.economico.cashFlow[i].ahorro, 2) + "€";

    var cell = row.insertCell(4);
    cell.innerHTML = UTIL.formatNumber(TCB.economico.cashFlow[i].IBI, 2) + "€";

    var cell = row.insertCell(5);
    cell.innerHTML = UTIL.formatNumber(TCB.economico.cashFlow[i].subvencion, 2) + "€";

    var cell = row.insertCell(6);
    if (TCB.economico.cashFlow[i].pendiente < 0) cell.classList.add("text-danger");
    cell.innerHTML = UTIL.formatNumber(TCB.economico.cashFlow[i].pendiente, 2) + "€";
  }

  UTIL.muestra("VAN", "", UTIL.formatNumber(TCB.economico.VANProyecto, 2), "€");
  UTIL.muestra("TIR", "", UTIL.formatNumber(TCB.economico.TIRProyecto, 2), "%");
  await loopAlternativas();
}

// Esta funcion hace un recorrido completo de todos los calculos con unos consumos y localizacion fija.
// Empieza con el número de paneles activo y busca alternativas para 25%, 50%, 150% y 200% de ese número
// Completa los arrays necesarios para el cálculo financiero.

async function loopAlternativas() {

  var numeroPanelesOriginal = TCB.instalacion.paneles;
  var intentos = [0.25, 0.5, 1, 1.5, 2];
  var paneles = [];
  var autoconsumo = [];
  var TIR = [];
  var autosuficiencia = [];
  var precioInstalacion = [];
  var consvsprod = [];
  var ahorroAnual = [];
  intentos.forEach((intento) => {
    let _pan = Math.trunc(numeroPanelesOriginal * intento);
    if (_pan >= 1) {
      _cambioInstalacion(_pan, TCB.instalacion.potenciaUnitaria);
      _initEconomico();
      paneles.push(_pan);
      autoconsumo.push((TCB.balance.autoconsumo / TCB.produccion.totalAnual) * 100);
      autosuficiencia.push((TCB.balance.autoconsumo / TCB.consumo.totalAnual) * 100);
      consvsprod.push((TCB.consumo.totalAnual/TCB.produccion.totalAnual) * 100);
      TIR.push(TCB.economico.TIRProyecto);
      precioInstalacion.push(TCB.instalacion.precioInstalacion());
      ahorroAnual.push(TCB.economico.ahorroAnual);
    }
  });

  // Dejamos las cosas como estaban antes del loop
  _cambioInstalacion(numeroPanelesOriginal, TCB.instalacion.potenciaUnitaria);
  await _initEconomico();

  //Buscamos punto en el que la produccion represente el 80% del consumo anual total
  let i = 0;
  while (consvsprod[i] > 80) i++;
    let pendiente = (consvsprod[i] - consvsprod[i-1]) / (paneles[i] - paneles[i-1]);
    let dif = 80 - consvsprod[i-1];
    let limiteSubvencion = paneles[i-1] + dif / pendiente;
    TCB.graficos.plotAlternativas(
      "graf_5",
      TCB.instalacion.potenciaUnitaria,
      paneles,
      TIR,
      autoconsumo,
      autosuficiencia,
      precioInstalacion,
      ahorroAnual,
      limiteSubvencion
    );
}
// Asignación de la función _Dispatch al objeto global window.
window.Dispatch = _Dispatch;
