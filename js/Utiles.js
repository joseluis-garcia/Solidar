import TCB from "./TCB.js";

export const nombreMes = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];
//indiceDia es utilizado para convertir una fecha de un año cualquiera en un indice dia entre 0 y 364
export const indiceDia = [
  [0, 0, 30],
  [1, 31, 58],
  [2, 59, 89],
  [3, 90, 119],
  [4, 120, 150],
  [5, 151, 180],
  [6, 181, 211],
  [7, 212, 242],
  [8, 243, 272],
  [9, 273, 303],
  [10, 304, 333],
  [11, 334, 364],
];

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if(pair[0] == variable) {
          return pair[1];
      }
  }
  return false;
}

function debugLog(msg, obj) {

  if (TCB.debug !== false) {
    console.log(msg);
    if (obj !== undefined && typeof obj === "object") {
      var objPropTxt = "";
      for (let objProp in obj) objPropTxt += objProp + "->" + obj[objProp] + "\n";
      console.log(objPropTxt);
    }
  }
}

function mete(unDia, idxTable, outTable) {
  var indiceDia = indiceDesdeDiaMes(unDia.dia, unDia.mes);
  for (let hora = 0; hora < 24; hora++) {
    if (idxTable[indiceDia].previos > 0) {
      //Impica que ya habia registros previos para ese dia
      unDia.valores[hora] =
        (outTable[indiceDia][hora] * idxTable[indiceDia].previos +
          unDia.valores[hora]) /
        (idxTable[indiceDia].previos + 1);
    }
    outTable[indiceDia][hora] = unDia.valores[hora];
  }

  idxTable[indiceDia].previos = idxTable[indiceDia].previos + 1;
  idxTable[indiceDia].dia = unDia.dia;
  idxTable[indiceDia].mes = unDia.mes;
  idxTable[indiceDia].suma = suma(unDia.valores);
  idxTable[indiceDia].maximo = Math.max(...unDia.valores);
}

async function getFileFromUrl(url, type) {
  const response = await fetch(url);
  const data = await response.blob();
  const metadata = { type: type || "text/csv" };
  return new File([data], metadata);
}

function csvToArray(str, delimiter = ",") {
  // slice from start of text to the first \n index
  // use split to create an array from string by delimiter
  try {
    var headers = str.slice(0, str.indexOf("\n")).split(delimiter);
  } catch (e) {
    alert("Posible error de formato fichero de consumos\n" + str);
    return;
  }
  debugLog("Cabecera CSV:", headers);

  // la diferencia entre los ficheros de Naturgy y de Iberdrola es que
  // la cuarta columna donde esta el consumo se llama Consumo en Naturgy y Consumo_kWh en Iberdrola y AE_kWh en ENDESA.
  // unificamos en "Consumo"
  if (headers[3] == "Consumo_kWh") headers[3] = "Consumo";
  if (headers[3] == "AE_kWh") headers[3] = "Consumo";

  let chk_consumo = false;
  let chk_fecha = false;
  let chk_hora = false;
  headers.forEach ( hdr => {
    if (hdr === "Consumo" || hdr === "2.0TD" || hdr === "3.0TD") chk_consumo = true;
    if (hdr === "Fecha") chk_fecha = true;
    if (hdr === "Hora") chk_hora = true;
  })
  if (! (chk_consumo && chk_fecha && chk_hora)) {
    let failHdr = "";
    if (!chk_consumo) failHdr += "Consumo "; 
    if (!chk_fecha) failHdr += "Fecha ";
    if (!chk_hora) failHdr += "Hora ";
    alert (i18next.t("consumo_MSG_errorCabeceras", {cabeceras: failHdr}));
    return [];
  }
  // slice from \n index + 1 to the end of the text
  // use split to create an array of each csv value row
  const rows = str.slice(str.indexOf("\n") + 1).split("\n");

  let arr = [];
  rows.forEach( (row) => {
    if(row.length > 1) {
      const values = row.split(delimiter);
      const el = headers.reduce(function (object, header, index) {
        object[header] = values[index];
        return object;
      }, {});
      arr.push(el);
    }
  })

  // return the array
  return arr;
}

function promedio(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function suma(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function muestra(donde, pre, valor, post) {
  if (document.getElementById(donde).type === 'number'){
    document.getElementById(donde).value = valor;
  } else {
    document.getElementById(donde).innerHTML = pre + valor + post;
  }
}

// Funciones de gestion de indice de dias -------------------------------------------------------------------
function difDays(inicio, fin) {
  let diferencia = fin.getTime() - inicio.getTime();
  return Math.ceil(diferencia / (1000 * 3600 * 24));
}

function indiceDesdeFecha(fecha) {
  var dia = fecha.getDate();
  var mes = fecha.getMonth();
  return indiceDia[mes][1] + dia - 1;
}

function indiceDesdeDiaMes(dia, mes) {
  return indiceDia[mes][1] + dia - 1;
}

function fechaDesdeIndice(indice) {
  for (let i = 0; i < 12; i++) {
    if (indiceDia[i][2] >= indice) {
      let mes = i;
      let dia = indice - indiceDia[mes][1] + 1;
      return [dia, mes];
    }
  }
}

function resumenMensual(idx, prop) {
  let _consMes = new Array(12).fill(0);
  for (let i = 0; i < 365; i++) {
    _consMes[idx[i].mes] += idx[i][prop];
  }
  return _consMes;
}

function dumpData(nombre, idxTable, dataTable) {
  // Loop the array of objects
  var csv;
  for (let row = 0; row < idxTable.length; row++) {
    let keysAmount = Object.keys(idxTable[row]).length;
    let keysCounter = 0;

    // If this is the first row, generate the headings
    if (row === 0) {
      // Loop each property of the object
      for (let key in idxTable[row]) {
        // This is to not add a comma at the last cell
        // The '\n' adds a new line
        csv += key + (keysCounter + 1 < keysAmount ? ";" : "");
        keysCounter++;
      }
      for (let i = 0; i < 24; i++) {
        csv += ";" + i;
      }
      csv += "\r\n";
    }
    keysCounter = 0;
    for (let key in idxTable[row]) {
      csv += idxTable[row][key] + (keysCounter + 1 < keysAmount ? ";" : "");
      keysCounter++;
    }
    for (let i = 0; i < 24; i++) {
      csv += ";" + dataTable[row][i];
    }
    csv += "\r\n";
  }

  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(csv)
  );
  element.setAttribute("download", nombre);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function muestraBalanceEnergia() {

  muestra("numeroPaneles", "", TCB.instalacion.paneles, "");
  muestra("potenciaUnitaria", "", TCB.instalacion.potenciaUnitaria, "");
  muestra("system_loss", "", TCB.rendimiento.system_loss, "%");
  muestra("technology", "", TCB.rendimiento.technology, "");
  muestra("PVGISinclinacion", "", TCB.rendimiento.inclinacion, "º");
  if (TCB.rendimiento.inclinacionOptimal) {
    muestra("inclinacionOptimal", "", TCB.i18next.t("resultados_MSG_si"), "");
  } else {
    muestra("inclinacionOptimal", "", TCB.i18next.t("resultados_MSG_no"), "");
  }
  muestra("PVGISazimut", "", TCB.rendimiento.azimut, "º");
  if (TCB.rendimiento.azimutOptimal) {
    muestra("azimutOptimal", "", TCB.i18next.t("resultados_MSG_si"), "");
  } else {
    muestra("azimutOptimal", "", TCB.i18next.t("resultados_MSG_no"), "");
  }
  muestra("objetivoHora", "", formatNumber(TCB.consumo.maximoAnual, 2), " kWh");
  muestra("PFVDiaria", "", formatNumber(TCB.consumo.totalAnual / TCB.consumo.numeroDias, 2), " kWh");
  muestra("PFVMensual", "", formatNumber(TCB.consumo.totalAnual / 12, 2), " kWh");
  muestra("PFVAnual", "", formatNumber(TCB.consumo.totalAnual, 2), " kWh");
  muestra("potenciaDisponible", "", formatNumber(TCB.instalacion.potenciaTotal(), 2), " kW");
  muestra("produccionMediaDiaria", "", formatNumber(TCB.produccion.totalAnual / 365, 2), " kWh");
  muestra("produccionMediaMensual", "", formatNumber(TCB.produccion.totalAnual / 12, 2), " kWh");
  muestra("produccionMediaAnual", "",formatNumber(TCB.produccion.totalAnual, 2)," kWh");
  muestra("CO2Anual", "",formatNumber(TCB.parametros.conversionCO2 * TCB.produccion.totalAnual, 2)," kg");

  muestra("porcientoEnergiaAhorrada", "",formatNumber(TCB.produccion.totalAnual / TCB.consumo.totalAnual * 100, 2)," %");
  
  if (TCB.consumo.totalAnual / TCB.produccion.totalAnual < 0.8) {
    document.getElementById("porcientoEnergiaAhorradaGenerada").style.color = 'red';
  } else {
    document.getElementById("porcientoEnergiaAhorradaGenerada").style.color = 'black';
  }
  muestra("porcientoEnergiaAhorradaGenerada", "",formatNumber(TCB.consumo.totalAnual / TCB.produccion.totalAnual * 100, 2)," %");

  let p_autoconsumo = (TCB.balance.autoconsumo / TCB.produccion.totalAnual) * 100;
  let p_autosuficiencia = (TCB.balance.autoconsumo / TCB.consumo.totalAnual) * 100;
  muestra("porcientoAutoconsumo", formatNumber(TCB.balance.autoconsumo, 2) + " kWh -> ",
             formatNumber(p_autoconsumo, 2), "%");
  muestra("porcientoAutosuficiencia", "", formatNumber(p_autosuficiencia, 2), "%");
  muestra("autosuficienciaMaxima", "",formatNumber(p_autosuficiencia + 100 - p_autoconsumo, 2),"%");
  muestra("energiaSobrante", formatNumber(TCB.balance.excedenteAnual,2) + " kWh -> ",
              formatNumber(TCB.balance.excedenteAnual / TCB.produccion.totalAnual * 100, 2), "%");
  muestra("energiaFaltante", formatNumber(TCB.balance.deficitAnual,2) + " kWh -> ", 
              formatNumber(TCB.balance.deficitAnual / TCB.consumo.totalAnual * 100, 2), "%");

  TCB.graficos.resumen_3D("graf_resumen");
  TCB.graficos.consumos_y_generacion("graf_1");
  TCB.graficos.balanceEnergia("graf_2", "graf_3");

}

async function muestraPestana ( nombre) {
  document.getElementById('titulo').innerHTML = TCB.i18next.t("ayuda_TIT_"+ nombre);
  //Esta es la version buena cuando esten todos los idiomas disponibles
  //const ficheroAyuda = "./locales/" + TCB.i18next.language.substring(0,2) + '-ayuda-' + nombre + '.htm'; 
  const ficheroAyuda = "./locales/" + 'es' + '-ayuda-' + nombre + '.htm';
  const text = await (await fetch(ficheroAyuda)).text();
  document.getElementById('texto').innerHTML = text;

  var current = document.getElementsByClassName("active");
  let activos = current.length;
  for (let i=0; i<activos; i++) {
    current[0].classList.remove("active");
  }
  var resultados = document.getElementById("nav-"+nombre+"-tab");
  resultados.classList.add("active");
  resultados.classList.add("show");
  var resultados_tab = document.getElementById(nombre+"-tab");
  resultados_tab.classList.add("active");
  resultados_tab.classList.add("show");
}

function muestraBalanceEconomico() {

  let consumoOriginalAnual = suma(TCB.economico.consumoOriginalMensual);
  let consumoConPlacasAnual = suma(TCB.economico.consumoConPlacasMensualCorregido);

  muestra("gastoAnualSinPlacas", "", formatNumber(consumoOriginalAnual, 2), "€");
  muestra("gastoAnualConPlacas", "", formatNumber(consumoConPlacasAnual, 2), "€");
  muestra("ahorroAnual", "", formatNumber(TCB.economico.ahorroAnual, 2), "€");
  muestra("costeInstalacion","",formatNumber(TCB.instalacion.precioInstalacion(), 2), "€");
  muestra("noCompensado", "", formatNumber(suma(TCB.economico.perdidaMes), 2), "€");
  muestra("ahorroAnualPorCiento", "",formatNumber((consumoOriginalAnual - consumoConPlacasAnual) / consumoOriginalAnual * 100, 2), "%");
  TCB.graficos.balanceEconomico("graf_4");
}

function formatNumber( numero, decimal) {
  if (decimal !== undefined) {
    //Segun la definción ISO (https://st.unicode.org/cldr-apps/v#/es/Symbols/70ef5e0c9d323e01) los numeros en 'es' no llevan '.' si no hay mas de dos 
    //digitos delante del '.' Minimum Grouping Digits = 2. Como no estoy de acuerdo con este criterio en el caso de 'es' lo cambio a 'ca' que funciona bien
    let lng = TCB.i18next.language.substring(0,2) === 'es' ? 'ca' : TCB.i18next.language.substring(0,2);
    return numero.toLocaleString(lng, {maximumFractionDigits: decimal});
  } else {
    return numero.toLocaleString();
  }
}

export {
  suma,
  promedio,
  csvToArray,
  muestra,
  debugLog,
  difDays,
  indiceDesdeFecha,
  fechaDesdeIndice,
  indiceDesdeDiaMes,
  mete,
  resumenMensual,
  dumpData,
  getFileFromUrl,
  getQueryVariable,
  muestraBalanceEnergia,
  muestraBalanceEconomico,
  formatNumber,
  muestraPestana
};
window.dumpData = dumpData;