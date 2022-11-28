import TCB from "./TCB.js";
import { generaInformePDF } from "./generaInformePDF.js";
import * as MAPA from "./Mapas.js";
import * as UTIL from "./Utiles.js";
import Graficos from "./Graficos.js";
import { initIdioma, traduce} from "./Idioma.js"


async function inicializaEventos() {

//Si recibimos argumento debug en la url ejecutamos con debug
  TCB.debug = UTIL.getQueryVariable('debug');
  UTIL.debugLog("_initEvents Debug activo: "+TCB.debug);

// Funcion para verificar que no se introducen valores negativos en los campos que tienen la clase .
// La validacion de html5 solo valida a nivel de submit del formulario pero no en cada campo
  var elems = document.getElementsByTagName("input");
  for(let i=0; i<elems.length; i++) {
      if (elems[i].type === 'number' && elems[i].min === '0') {
          elems[i].addEventListener("input", (e) => {
            e.target.checkValidity() ||(e.target.value='');
          })
      }
  }

  //Inicializacion graficos Plotly
  TCB.graficos = new Graficos();

  //Inicializacion proceso i18n
  await initIdioma();
  document.getElementById("idioma").value = TCB.i18next.language.substring(0,2);

  // Inicializa la gestión del mapa
  UTIL.debugLog("_initEvents call MAPA.mapaLocalizacion");
  MAPA.mapaLocalizacion();
  
  // Define la url base de la aplicación
  let fullPath = window.location.href;
  let ipos = fullPath.lastIndexOf("/");
  TCB.basePath = fullPath.slice(0, ipos + 1);
  UTIL.debugLog("_initEvents ejecutando desde " + TCB.basePath);

  // Se incializan los tooltips
  var tooltipList1 = [].slice.call(document.querySelectorAll('[data-bs-html="true"]'));
  var tooltipList2 = tooltipList1.map(function (tooltipTriggerfun) {  
    return new bootstrap.Tooltip(tooltipTriggerfun);  
  }) 

  // Se pone la palabra localización en el campo de direccion porque i18next no lo traduce.
  document.getElementById('direccion').value = i18next.t("proyecto_LBL_localizacion");

  // Se carga la pestaña inicial que es la de localización
  UTIL.muestraPestana('localizacion');
  
  // ---> Eventos del menu general de opciones y formularios asociados

  // Los parametros estan definidos en el objeto TCB.parametros
  // Este modulo asigna los valores por defecto inicializados en TCB y asigna eventlisteners para cambiar la TCB en funcion de lo
  // entrado por el usuario en el formulario de parametros
  for (let param in TCB.parametros) {
    let campo = document.getElementById(param);
    campo.value = TCB.parametros[param];
    campo.addEventListener("change", function handleChange(event) { 
      TCB.parametros[event.target.id] = event.target.value == "" ? 0 : event.target.value;
    });
  }

  // lectura del fichero de precios de instalación del servidor. Si falla se usan las de la TCB
  const ficheroPreciosInstalacion = "./datos/precios instalacion.json";
  UTIL.debugLog("Precios instalación leidos desde servidor:" + ficheroPreciosInstalacion);
  try {
    const precios = await fetch(ficheroPreciosInstalacion);
    if (precios.status === 200) {
      TCB.precioInstalacion = await precios.json();
    }
  } catch (err) {
    UTIL.debugLog("Error leyendo precios de instalación del servidor " + err.message + "<br>Seguimos con TCB");
  }

  // lectura del fichero de tarifas del servidor. Si falla se usan las de la TCB
  const ficheroTarifa = "./datos/tarifas.json";
  UTIL.debugLog("Tarifas leidas desde servidor:" + ficheroTarifa);
  try {
    const respuesta = await fetch(ficheroTarifa);
    if (respuesta.status === 200) {
      TCB.tarifas = await respuesta.json();
    }
  } catch (err) {
    UTIL.debugLog("Error leyendo tarifas del servidor " + err.message + "<br>Seguimos con TCB");
  }
  
  document.getElementById('tarifaFile').addEventListener("change", async function handleChange(event) {
    if (this.files.length == 1) {
      let reader = new FileReader();
      reader.onload = (e) => {
        try {
          TCB.tarifas = JSON.parse(e.target.result);
          TCB.tarifaActiva = document.getElementById('tarifa').value;
          for (let i=0; i<=6; i++){
            document.getElementById("tarifaP"+i).value = TCB.tarifas[TCB.tarifaActiva].precios[i];
          }
        } catch (err) {
          alert(i18next.t("precios_MSG_errorLecturaFicheroTarifas") + "\nParser.error: " + err);
        }
      }
      reader.onerror = (err) => {
        alert(i18next.t("precios_MSG_errorLecturaFicheroTarifas") + "\nReader.error: " + reader.error);
        reject("...error de lectura");
      }
      
      reader.readAsText(this.files[0]);
    }
  });

  // Evento del boton de instrucciones
  document.getElementById('instrucciones').addEventListener("click", async function handleChange(event) {
    let tlng = TCB.i18next.language;
    if (TCB.i18next.language === "eu") {  //Euskera aun no traducido
      alert("Lo sentimos, las instrucciones aun no estan traducidas al euskera. Las mostraremos en castellano");
      tlng = 'es';
    };
    window.open('./locales/instrucciones/Instrucciones_'+tlng+'.html', '_blank');
  });

  // Formulario de bienvenida
  const noMostrarMas = document.cookie.split('=')[1];
   if (noMostrarMas === 'false' || noMostrarMas === undefined) {
    const ficheroBienvenida = "./locales/" + 'es' + '-bienvenida.htm';
    const text = await (await fetch(ficheroBienvenida)).text();
    const formBienvenida = document.getElementById("formularioBienvenida");
    document.getElementById('textoBienvenida').innerHTML = text;
    formBienvenida.style.display = "block";
    formBienvenida.classList.add("show");
    document.getElementById('cerrarBienvenida').addEventListener("click", async function handleChange(event) {
      document.cookie = "noMostrarMas=" + document.getElementById('noMostrarMas').checked;
      formBienvenida.style.display = "none";
      formBienvenida.classList.remove("show");
    });
  }
  
  // Inicialización y evento asociado a la generación del informe pdf
  document.getElementById('informeMenu').addEventListener("click", procesaInformePDF);
  document.getElementById('informeResumen').addEventListener("click", procesaInformePDF);
  
  function procesaInformePDF(event) { 
    if (TCB.economicoCreado) {
      generaInformePDF(true);
    } else {
      alert(TCB.i18next.t('informe_MSG_procesarPrimero'));
    }};

  // Boton muestra/oculta ayuda
  document.getElementById("ayuda").addEventListener("click", function handleChange(event) { 
    var resultados = document.getElementById("panelDerecho");
    if (resultados.classList.contains( 'collapse' )) {
        resultados.classList.remove("collapse");
        resultados.classList.add("collapse.show");
    } else {
        resultados.classList.add("collapse");
    }
  });

  //Botones del formulario de parametros para descargar matrices de los objetos de la aplicación
  //Estas funciones permiten descargar las tablas de la aplicación para verificacion o debug
  document.getElementById("dumpConsumo").addEventListener("click", function handleChange(event) { 
    if (TCB.consumoCreado) dumpData("consumos.csv",TCB.consumo.idxTable, TCB.consumo.diaHora)});
  document.getElementById("dumpProduccion").addEventListener("click", function handleChange(event) { 
    if (TCB.produccionCreada) dumpData("produccion.csv", TCB.produccion.idxTable, TCB.produccion.diaHora)});
  document.getElementById("dumpRendimiento").addEventListener("click", function handleChange(event) { 
    if (TCB.rendimientoCreado) dumpData("rendimiento.csv", TCB.rendimiento.idxTable, TCB.rendimiento.diaHora)});
  document.getElementById("dumpBalance").addEventListener("click", function handleChange(event) { 
    if (TCB.balanceCreado) dumpData("balance.csv", TCB.balance.idxTable, TCB.balance.diaHora)});
  document.getElementById("dumpPrecioOriginal").addEventListener("click", function handleChange(event) { 
    if (TCB.economicoCreado) dumpData("precioSinPaneles.csv", TCB.economico.idxTable, TCB.economico.diaHoraPrecioOriginal)});
  document.getElementById("dumpPrecioConPaneles").addEventListener("click", function handleChange(event) { 
      if (TCB.economicoCreado) dumpData("precioConPaneles.csv", TCB.economico.idxTable, TCB.economico.diaHoraPrecioConPaneles)});

  // Evento de cambio de idioma DOM.id: "idioma"
  const idioma = document.getElementById("idioma");
  idioma.addEventListener("change", function handleChange(event) {
      traduce(event.target.value);
  });

    // ---> Eventos de control del wizard y la ayuda
    // Botones de siguiente y anterior
    document.getElementById("btnSiguiente").addEventListener("click", function handleChange(event) { eventoWizard('Siguiente')});
    document.getElementById("btnAnterior").addEventListener("click", function handleChange(event) { eventoWizard('Anterior')});

    async function eventoWizard( hacia) {
      // ¿que panel esta activo y en que direccion nos queremos mover?
      let steps = ['localizacion', 'consumo', 'resultados', 'precios', 'graficos', 'reporte'];
      var current = document.getElementsByClassName("tab-pane active")[0];
      let step = steps.findIndex((e) => { return (e+'-tab' === current.id) });
      if (hacia === 'Siguiente') {
        if (step < steps.length - 1) {
          if (await validaStep( steps[step])) {
            step += 1;
            UTIL.muestraPestana(steps[step]);
          }
        }
      } else {
        step -= 1;
        if (step >= 0) UTIL.muestraPestana(steps[step]);
      }
    }
    
    // Se verifica si estan dadas las condiciones para pasar al siguiente paso
    async function validaStep( panelActivo) {
      var status;
      switch (panelActivo) {
      case "localizacion":
        if (document.getElementById("lonlat").value === "") {
          alert (i18next.t('dispatcher_MSG_definePosicionMapa'));
          return false;
        } else {
          if (TCB.nuevaLocalizacion) {
            MAPA.resetMap();
            status = await Dispatch('Rendimiento');
            TCB.nuevaLocalizacion = false;
            return status;
          }
        }
        return true;
      case "consumo":
        if (!TCB.consumoCreado) {
          alert (i18next.t('proyecto_MSG_definirFicheroConsumo'));
          return false;
        } else {
          MAPA.resetMap();
          status = await Dispatch('Calcular energia');
          return status;
        }

      case "graficos":
        generaInformePDF(false);
        return true;

      default:
        return true;
      }
    }

    // ---> Eventos de la pestaña rendimiento
    // Evento para registrar el nombre del proyecto activo en TCB
    document.getElementById("proyecto").addEventListener("change", async function handleChange(event) {
      TCB.proyectoActivo = event.target.value;
    });

    // Evento para registrar la entrada de lon-lat a mano
    const lonlatCampo = document.getElementById("lonlat");
    lonlatCampo.addEventListener("change", async function handleChange(event) {
      let point = lonlatCampo.value.split(',').map(x => parseFloat(x));
      if (!await MAPA.verificaTerritorio(point)) {
        document.getElementById("lonlat").value = "";
        return false;
      } else {
        TCB.nuevaLocalizacion = true;
        MAPA.primerPunto( point);
      }
    });

    // Evento para gestionar las opciones de fichero CSV o perfil REE. DOMid: "desdeFichero" y DOMid: "desdePotencia"
    document.getElementById("desdeFichero").addEventListener("change", cambioFuente);
    document.getElementById("desdePotencia").addEventListener("change", cambioFuente);
    function cambioFuente() {
      TCB.consumoCreado = false;
      document.getElementById('graf_resumenConsumo').style.display = 'none';
      var datoFichero = document.getElementById("csvfile");
      var datoPotencia = document.getElementById("potenciaAno");
      datoFichero.value = "";
      datoFichero.disabled = !datoFichero.disabled;
      datoPotencia.value = "";
      datoPotencia.disabled = !datoPotencia.disabled;
    }

    // Evento para gestionar el boton de carga fichero CSV de consumos DOMid: "csvFile"
    const filecsv = document.getElementById("csvfile");
    filecsv.addEventListener("change", async function handleChange(event) {
      UTIL.debugLog("pasando a _initConsumos ", { fuente: "CSV", campo: "Consumo" });
      TCB.fuenteConsumos = { fuente: "CSV", campo: "Consumo" };
      Dispatch ('Consumo');
    });
      
    // Evento para lanzar la carga del fichero CSV del perfil REE DOMid: "cargarREE"
    document.getElementById("cargarREE").addEventListener("click", async function handleChange(event) {
        if (document.getElementById("potenciaAno").value === "" || document.getElementById("potenciaAno").value <= 0) { //Debemos tener un consumo anual base para hacer el cálculo
          alert(i18next.t("proyecto_MSG_definirPotenciaBaseREE"));
          document.getElementById("potenciaAno").value = "";
          return false;
        } else {
          UTIL.debugLog("pasando a _initConsumos ", { fuente: "CSV", campo: "Consumo" });
          TCB.fuenteConsumos = {fuente: "REE",campo: document.getElementById("tarifa").value};
          Dispatch ('Consumo'); //Cuando se trata de cargar los datos de REE se distingue el perfil de consumo en base a la tarifa
        }
    });
       
    // Evento para gestionar las opciones de inclinacion entre un valor entrado por el usuario o la opción optimo.
    const inclinacion = document.getElementById("inclinacion");
    const inclinacionOptima = document.getElementById("inclinacionOptima");
    inclinacion.addEventListener("change", manageInclinacion);
    inclinacionOptima.addEventListener("change", manageInclinacion);
    function manageInclinacion() {
      TCB.nuevaLocalizacion = true;
      const _inc = document.getElementById("inclinacion").value;

      const _flg = document.getElementById("inclinacionOptima");
      if (_inc === "" && !_flg.checked) {
        _flg.checked = true;
      } else if (_flg && _inc !== "") {
        _flg.checked = false;
      }
    }
      
    // Evento para gestionar las opciones de azimut entre un valor entrado por el usuario o la opción optimo.
    const azimut = document.getElementById("azimut");
    const azimutOptima = document.getElementById("azimutOptima");
    azimut.addEventListener("change", manageazimut);
    azimutOptima.addEventListener("change", manageazimut);
    function manageazimut() {
      TCB.nuevaLocalizacion = true;
      const _inc = document.getElementById("azimut").value;
      const _flg = document.getElementById("azimutOptima");
      if (_inc === "" && !_flg.checked) {
        _flg.checked = true;
      } else if (_flg && _inc !== "") {
        _flg.checked = false;
      }
    }
      
    // Evento disparado el seleccionar una direccion de la lista de candidatos obtenida de Nominatim. DOMid: "candidatos"
    // Cada  elemento de la lista de candidatos tiene asociado el value de lon-lat que es pasado en el evento
    const listaCandidatos = document.getElementById("candidatos");
    listaCandidatos.addEventListener("click", async function handleChange(event) {
      await MAPA.centraMapa(event.target.value);
    });
  
    // Evento disparado al escribir una dirección. DOMid: "direccion"
    // Una vez capturado el nombre se pasa a Nominatim para obtener la lista de candidatos
    const direccion = document.getElementById("direccion");
    direccion.addEventListener("change", async function handleChange1(event) {
      await MAPA.mapaPorDireccion("localizacion");
    });
    
    // ---> Eventos de la pestaña consumos
    // Evento para gestionar los campos relativos a los precios de tarifas. DOMid: "tarifa"
    const select = document.getElementById("tarifa");
    select.addEventListener("change", function handleChange(event) {
      TCB.tarifaActiva = event.target.value;
      for (let i=0; i<=6; i++){
        document.getElementById("tarifaP"+i).value = TCB.tarifas[TCB.tarifaActiva].precios[i];
      }
      if (event.target.value == "3.0TD") {
        document.getElementById("tablaTarifas3.0TD").style.display = "block";
      } else {
        document.getElementById("tablaTarifas3.0TD").style.display = "none";
      }
    });
  
    // Carga los valores de tarifas definidos en TCB en los campos correspondientes 
    document.getElementById("tarifa").value = TCB.tarifaActiva;
    for (let i=0; i<=6; i++){
      document.getElementById("tarifaP"+i).value = TCB.tarifas[TCB.tarifaActiva].precios[i];
    }

    // Asigna el listener para gestionar sus cambios.
    for (let i=0; i<=6; i++){
      let cTarifa = document.getElementById("tarifaP"+i);
      cTarifa.addEventListener("change", function handleChange(event) {
        TCB.tarifas[TCB.tarifaActiva].precios[event.target.id.substring(7)] = event.target.value;
      });
    }
  
    // ---> Eventos de la pestaña balance energia
    // Evento para gestionar los cambios de instalacion DOMid: "numeroPaneles" y DOMid: "potenciaUnitaria"
    document.getElementById("numeroPaneles").addEventListener("change", (e) => _nuevaInstalacion( e));
    document.getElementById("potenciaUnitaria").addEventListener("change", (e) =>_nuevaInstalacion( e));
    function _nuevaInstalacion(evento) {
      if (evento.target.id == "numeroPaneles") TCB.instalacion.paneles = evento.target.value;
      if (evento.target.id == "potenciaUnitaria") TCB.instalacion.potenciaUnitaria = evento.target.value;
      Dispatch("Cambio instalacion");
    }
  
    // ---> Eventos de la pestaña balance economico
    // Evento para gestionar la modificacion del precio de instalación
    document.getElementById("correccionCoste").addEventListener("change", (e) => _modificaPrecioInstalacion( e));
    function _modificaPrecioInstalacion(evento) {
      TCB.correccionPrecioInstalacion = parseFloat(evento.target.value);
      UTIL.muestra("costeCorregido", "", UTIL.formatNumber(TCB.instalacion.precioInstalacionCorregido(), 2), "€");
      Dispatch("Cambio precio instalacion");
    }


    // Evento para cargar la subvención EU DOMid: "subvencionEU"
    // La subvención EU solo se puede aplicar cuando el autoconsumo es superior al 80%
    const subvencion = document.getElementById("subvencionEU");
    subvencion.addEventListener("change", function handleChange(event) {
        Dispatch("Cambio subvencion");
    });
  
    // Evento para gestionar la subvención del IBI
    document.getElementById("valorIBI").addEventListener("change", chkIBI);
    document.getElementById("porcientoSubvencionIBI").addEventListener("change", chkIBI);
    document.getElementById("duracionSubvencionIBI").addEventListener("change", chkIBI);
    function chkIBI() {
      Dispatch('Economico');
    }

    return true;
  }

  export {inicializaEventos};