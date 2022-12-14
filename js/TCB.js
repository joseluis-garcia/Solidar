// Modulo de variable globales y valores por defecto
const TCB = {
    consumo:"",
    rendimiento:"",
    instalacion:"",
    produccion:"",
    balance:"",
    economico:"",
    graficos:"",

    //Variables globales de funcionamiento
    debug : false,
    basePath : "",
    pdfDoc: "",
    pasoWizard: 0,

    nuevaLocalizacion : false,
    consumoCreado : false,
    localizacionDefinida : false,
    rendimientoCreado : false,
    instalacionCreada : false,
    produccionCreada : false,
    balanceCreado : false,
    economicoCreado : false,

    //Algunos valores por defecto
    // Estos precios son los de SOM a agosto 2022 y no deberían estar aqui.
    tarifas : { 
        '2.0TD': { 
            precios: [0.187, 0.357, 0.293, 0.241, 0, 0, 0],
            horas: [3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2]
        },
        '3.0TD': { 
            precios: [0.187, 0.355, 0.324, 0.296, 0.269, 0.246, 0.239],
            horas: [
                [6, 6, 6, 6, 6, 6, 6, 6, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2],
                [6, 6, 6, 6, 6, 6, 6, 6, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2],
                [6, 6, 6, 6, 6, 6, 6, 6, 3, 2, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 3, 3],
                [6, 6, 6, 6, 6, 6, 6, 6, 5, 4, 4, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 5, 5],
                [6, 6, 6, 6, 6, 6, 6, 6, 5, 4, 4, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 5, 5],
                [6, 6, 6, 6, 6, 6, 6, 6, 4, 3, 3, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4],
                [6, 6, 6, 6, 6, 6, 6, 6, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2],
                [6, 6, 6, 6, 6, 6, 6, 6, 4, 3, 3, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4],
                [6, 6, 6, 6, 6, 6, 6, 6, 4, 3, 3, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4],
                [6, 6, 6, 6, 6, 6, 6, 6, 5, 4, 4, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 5, 5],
                [6, 6, 6, 6, 6, 6, 6, 6, 3, 2, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 3, 3],
                [6, 6, 6, 6, 6, 6, 6, 6, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2],
            ]}
    },
    tarifaActiva : '2.0TD',
    proyectoActivo: "",
    localizacion: "",
    fuenteConsumos : {},
    pdf : "",
    
    // Parametros por defecto
    parametros : {
        conversionCO2 : 0.440,
        impuestoElectrico : 5.113,
        IVAenergia : 5.0,
        IVAinstalacion : 21.0,
        perdidasSistema : 14,
        interesVAN : 3,
        tecnologia : 'crystSi',
        potenciaPanelInicio : 0.450
    },
    precioInstalacion :[
        {"desde":0, "hasta":2, "precio":2200},
        {"desde":2, "hasta":5, "precio":1700},
        {"desde":5, "hasta":10, "precio":1400},
        {"desde":10, "hasta":15, "precio":1150},
        {"desde":15, "hasta":20, "precio":1050},
        {"desde":20, "hasta":25, "precio":1000},
        {"desde":25, "hasta":100, "precio": 950}
    ],
    correccionPrecioInstalacion : 0,
    
    subvencionEU : {
        'Individual': {'<=10kWp':600, '>10kWp': 450},
        'Comunitaria' : {'<=10kWp':710, '>10kWp':535}
    },
    conversionCO2 : {
        'Peninsula' : {
            'renovable' : 0.331,
            'norenovable' : 0.472
        },
        'Islas Baleares' : {
            'renovable' : 0.932,
            'norenovable' : 0.966
        },
        'Canarias' : {
            'renovable' : 0.776,
            'norenovable' : 0.825
         },
        'Ceuta': {
            'renovable' : 0.721,
            'norenovable' : 0.735
        },
        'Melilla': {
            'renovable' : 0.721,
            'norenovable' : 0.735
        }
    }
}
export default TCB

