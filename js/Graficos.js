import * as UTIL from "./Utiles.js";
import TCB from "./TCB.js";

export default class Graficos {   

    consumos_y_generacion(donde){
    var resConsumo = UTIL.resumenMensual(TCB.consumo.idxTable, 'suma');
    var trace1 = {
        x: UTIL.nombreMes,
        y: resConsumo,
        type: 'scatter',
        name: i18next.t('graficos_LBL_graficasConsumo')
    };
    
    var resProduccion = UTIL.resumenMensual(TCB.produccion.idxTable, 'suma');
    var trace2 = {
        x: UTIL.nombreMes,
        y: resProduccion,
        type: 'scatter',
        name: i18next.t('graficos_LBL_graficasProduccion')
    };

    var layout = {
        paper_bgcolor:'rgba(0,0,0,0)',
        plot_bgcolor:'rgba(0,0,0,0)',
        title: i18next.t('graficos_LBL_produccionMediaMensual', {potencia: UTIL.formatNumber(TCB.instalacion.potenciaTotal(), 2)}),
        yaxis: {
            title: 'kWh'
        }
    };
    
    var data = [trace1, trace2];
    Plotly.react(donde, data, layout);
    }

    consumo_3D (donde1, donde2) {

        var g_consumo = {
            z: TCB.consumo.diaHora,
            name: i18next.t('graficos_LBL_graficasConsumo'),
            type: 'contour',
            colorscale: [
                ['0.0', 'rgb(250,250,250)'],
                ['0.10', 'rgb(240,240,240)'],
                ['0.20', 'rgb(230,200,200)'],
                ['0.5', 'rgb(220,120,150)'],
                ['1.0', 'rgb(254,79,67)']],
            line: {
                width:0.1,
                smoothing: 0
            },
            zsmooth: 'best',
            connectgaps: true,
            showlegend: true,
            showscale: true
        };

        var layout_resumen = {
            title: {
                text: i18next.t('graficos_LBL_graficasConsumo'),
                xanchor: 'left', // or 'auto', which matches 'left' in this case
                yanchor: 'bottom',
                x: 0,
                y: 0.5,
              },
            xaxis:{title: i18next.t('graficos_LBL_graficasHora')},
            yaxis:{title: i18next.t('graficos_LBL_graficasDia')},
            zaxis:{title: 'kWh'},
            paper_bgcolor:'rgba(0,0,0,0)',
            plot_bgcolor:'rgba(0,0,0,0)',
            autosize: true,
            margin: {
                l: 150,
                r: 10,
                b: 65,
                t: 25
              },
            annotations: [],
            shapes: [{
                  type: 'line',
                  x0: -0.5, y0: UTIL.indiceDesdeFecha(TCB.consumo.fechaInicio),
                  x1: 23.5, y1: UTIL.indiceDesdeFecha(TCB.consumo.fechaInicio),
                  line: {color: 'rgb(255, 0, 0)', width: 3}
                }],
        };

        var inicioAnotation = {
            x: 0, y: UTIL.indiceDesdeFecha(TCB.consumo.fechaInicio),
            xref: 'x', yref: 'y',
            text: 'Inicio',
            xanchor: 'right',
            textangle: 0,
            ax: -20,
            ay: 0
        };
        layout_resumen.annotations.push(inicioAnotation);
        for (let i=0; i<12; i++) {
            layout_resumen.annotations.push({
                    x: 0, y: UTIL.indiceDia[i][1],
                    xref: 'x', yref: 'y',
                    text: UTIL.nombreMes[i],
                    xanchor: 'left',
                    textangle: -90,
                    ax: -15,
                    ay: -15
            });
        }
        Plotly.react(donde1, [g_consumo], layout_resumen);

        var gd = document.getElementById(donde1);
        gd.addEventListener('click', function(evt) {

            var posicion = this.getBoundingClientRect();
            // console.log(posicion.top, posicion.right, posicion.bottom, posicion.left);

            var xaxis = this._fullLayout.xaxis;
            var yaxis = this._fullLayout.yaxis;
            var l = this._fullLayout.margin.l;
            var t = this._fullLayout.margin.t;
            var r = gd._fullLayout.margin.r;
            var w = gd._fullLayout.margin.width;

            let xInDataCoord = xaxis.p2c(evt.x - l - posicion.right);
            let yInDataCoord = yaxis.p2c(evt.y - t - posicion.top);

            let dia = Math.round(yInDataCoord);
            let fecha = UTIL.fechaDesdeIndice(dia);

            var trace1 = {
                y: TCB.consumo.diaHora[dia],
                type: 'scatter',
                showlegend : false,
                name: i18next.t('graficos_LBL_graficasConsumo'),
                line: {shape: 'spline', width:3, color:'rgb(0,0,255'}
            };

            var trace2 = {
                y: TCB.consumo.diaHora[dia],
                type: 'bar',
                showlegend : false,
                width: 0.1,
                hoverinfo: 'none',
                marker : {'color': TCB.consumo.diaHora[dia],
                    cmax : TCB.consumo.maximoAnual,
                    cmin : 0,
                    colorscale: [
                    ['0.0', 'rgb(250,250,250)'],
                    ['0.10', 'rgb(240,240,240)'],
                    ['0.20', 'rgb(230,200,200)'],
                    ['0.5', 'rgb(220,120,150)'],
                    ['1.0', 'rgb(254,79,67)']]}
            };
            var layout = {
                paper_bgcolor:'rgba(0,0,0,0)',
                plot_bgcolor:'rgba(0,0,0,0)',
                title: "Dia:" + fecha[0] + "/" + (parseInt(fecha[1])+1),
                xaxis: {title: TCB.i18next.t('graficos_LBL_graficasHora'), dtick: 1},
                yaxis: {title: 'kWh', showline: true, zeroline: true, zerolinecolor :'#969696', zeroline : true, gridcolor : '#bdbdbd', gridwidth : 2 }
            };
            Plotly.react(donde2, [trace1, trace2], layout);
        });
    }

    resumen_3D ( donde) {

    var g_produccion = {
        z: TCB.produccion.diaHora,
        name: i18next.t('graficos_LBL_graficasProduccion'),
        type: 'surface',
        colorscale: 'YlOrRd',
        opacity:1,
        showlegend:true,
        showscale: false
    };

    var g_consumo = {
        z: TCB.consumo.diaHora,
        name: i18next.t('graficos_LBL_graficasConsumo'),
        type: 'surface',
        colorscale: 'Picnic',
        opacity:0.8,
        showlegend:true,
        showscale: false
    };
  
    var layout_resumen = {
        paper_bgcolor:'rgba(0,0,0,0)',
        plot_bgcolor:'rgba(0,0,0,0)',
        title: {
            text: i18next.t('graficos_LBL_graficasProduccion') + " vs " + i18next.t('graficos_LBL_graficasConsumo'),
            xanchor: 'left', // or 'auto', which matches 'left' in this case
            yanchor: 'bottom',
            x: 0,
            y: 0.5,
          },
        scene: {
            xaxis:{title: TCB.i18next.t('graficos_LBL_graficasHora')},
            yaxis:{title: TCB.i18next.t('graficos_LBL_graficasDia')},
            zaxis:{title: 'kWh'},
            camera: {eye: {x: -1.5, y: -1.5, z: 0.5}}
            },
        autosize: false,

        width: 1200,
        height: 600,
        margin: {
            l: 200,
            r: 0,
            b: 65,
            t: 25
          }
    };

    Plotly.react(donde, [g_consumo, g_produccion], layout_resumen);
    }

    balanceEnergia (donde1, donde2){
        var autoconsumo = UTIL.resumenMensual(TCB.balance.idxTable, 'autoconsumo');
        var excedente = UTIL.resumenMensual(TCB.balance.idxTable, 'excedente');
        var deficit = UTIL.resumenMensual(TCB.balance.idxTable, 'deficit');
        var consumo = UTIL.resumenMensual(TCB.consumo.idxTable, 'suma');
        var produccion = UTIL.resumenMensual(TCB.produccion.idxTable, 'suma');
        
        var trace_produccion = {
            x: UTIL.nombreMes,
            y: produccion,
            name: i18next.t('graficos_LBL_graficasProduccion'),
            type: 'scatter'
        };
        
        var trace_consumo = {
            x: UTIL.nombreMes,
            y: consumo,
            name: i18next.t('graficos_LBL_graficasConsumo'),
            type: 'scatter'
        };

        var trace_excedente = {
            x: UTIL.nombreMes,
            y: excedente,
            name: i18next.t('graficos_LBL_graficasExcedente'),
            type: 'bar'
        };

        var trace_deficit = {
            x: UTIL.nombreMes,
            y: deficit,
            name: i18next.t('graficos_LBL_graficasDeficit'),
            type: 'bar'
        };

        var trace_autoconsumo = {
            x: UTIL.nombreMes,
            y: autoconsumo,
            name: i18next.t('graficos_LBL_graficasAutoconsumo'),
            type: 'bar'
        };

        var layout = {
            paper_bgcolor:'rgba(0,0,0,0)',
            plot_bgcolor:'rgba(0,0,0,0)',
            title: i18next.t('graficos_LBL_balanceProduccion', {potencia: UTIL.formatNumber(TCB.instalacion.potenciaTotal(), 2)}),
            barmode: 'stack',
            yaxis: {
                title: 'kWh'
            }
        };
      
        var data = [trace_produccion, trace_autoconsumo, trace_excedente];
        Plotly.react(donde1, data, layout);

        var layout = {
            paper_bgcolor:'rgba(0,0,0,0)',
            plot_bgcolor:'rgba(0,0,0,0)',
            title: i18next.t('graficos_LBL_balanceConsumo', {potencia: UTIL.formatNumber(TCB.instalacion.potenciaTotal(), 2)}),
            barmode: 'stack',
            yaxis: {
                title: 'kWh'
            }
        };
        var data1 = [trace_consumo, trace_autoconsumo, trace_deficit  ];
        Plotly.react(donde2, data1, layout);
    }

    balanceEconomico (donde1){

        var _perdidas = new Array(12);
        var _compensado = new Array(12);
        for (let i=0; i<12; i++) { //las perdidas y lo compensado lo graficamos negativo
            _perdidas[i] = -TCB.economico.perdidaMes[i];
            _compensado[i] = -TCB.economico.compensadoMensualCorregido[i];
        }

        var trace_pagado = {
            x: UTIL.nombreMes,
            y: TCB.economico.consumoConPlacasMensualCorregido,
            name: i18next.t('graficos_LBL_graficasGastoConPaneles'),
            type: 'scatter',
            line: {shape: 'spline', width:3, color:'rgb(0,0,255'}
        };

        var trace_base = {
            x: UTIL.nombreMes,
            y: TCB.economico.consumoConPlacasMensualCorregido,
            name: 'base',
            type: 'bar',
             hoverinfo: 'none',
            showlegend: false, 
            marker: {
                color: 'rgba(1,1,1,0.0)'
            }
        };

        var trace_consumo = {
            x: UTIL.nombreMes,
            y: TCB.economico.consumoOriginalMensual,
            name: i18next.t('graficos_LBL_graficasGastoSinPaneles'),
            type: 'scatter',
            line: {shape: 'spline', width:3, color:'rgb(255,0,0)'}
        }

        var trace_compensa = {
            x: UTIL.nombreMes,
            y: _compensado,
            width: 0.1,
            marker: {color: 'rgb(204, 186, 57)'},
            name: i18next.t('graficos_LBL_graficasCompensacion'),
            type: 'bar'
        }

        var trace_ahorro = {
            x: UTIL.nombreMes,
            y: TCB.economico.ahorradoAutoconsumoMes, //_ahorroAutoconsumo,
            width: 0.1,
            marker: {color: 'rgb(104, 158, 43)'},
            name: i18next.t('graficos_LBL_graficasAutoconsumo'),
            type: 'bar'
        }

         var trace_perdida = {
            x: UTIL.nombreMes,
            y: _perdidas,
            width: 0.5,
            name: i18next.t('graficos_LBL_graficasNoCompensado'),
            base:0,
            type: 'bar'
        } 

        var layout = {
            paper_bgcolor:'rgba(0,0,0,0)',
            plot_bgcolor:'rgba(0,0,0,0)',
            width: 800,
            height: 500,
            autoadjust: true,
            title: i18next.t('graficos_LBL_tituloBalanceEconomico', {potencia: UTIL.formatNumber(TCB.instalacion.potenciaTotal(), 2)}),
            barmode: 'relative',
            yaxis: {
                title: 'Euros',
                gridcolor:'grey',
            },
            xaxis: {
                gridcolor:'grey'
            }
        };
        var data1 = [ trace_consumo, trace_pagado, trace_base, trace_compensa, trace_ahorro, trace_perdida]; //
        Plotly.react(donde1, data1, layout);
    }

    plotAlternativas (donde, potencia_kWp, paneles, TIR, autoconsumo, prodvscons, precioInstalacion, ahorroAnual, limiteSubvencion) {

        var trace_TIR = {
            x: paneles,
            y: TIR,
            name: 'TIR(%)',
            type: 'scatter'
        };

        var trace_prodvscons = {
            x: paneles,
            y: prodvscons,
            name: i18next.t('graficos_LBL_graficasprodvscons') + "(%)",
            type: 'scatter'
        };

        var trace_autoconsumo = {
            x: paneles,
            y: autoconsumo,
            name: i18next.t('graficos_LBL_graficasAutoconsumo') + "(%)",
            type: 'scatter'
        };

        var trace_precioInstalacion = {
            x: paneles,
            y: precioInstalacion,
            name: i18next.t('graficos_LBL_graficasInversion') + "(€)",
            yaxis : 'y2',
            type: 'scatter'
        };

        var trace_ahorroAnual = {
            x: paneles,
            y: ahorroAnual,
            name: i18next.t('graficos_LBL_graficasAhorro') + "(€)",
            yaxis : 'y2',
            type: 'scatter'
        };

 
        var layout = {
            paper_bgcolor:'rgba(0,0,0,0)',
            plot_bgcolor:'rgba(0,0,0,0)',
            width: 800,
            height: 500,
            title: i18next.t('graficos_LBL_alternativasPotencia', {potencia: UTIL.formatNumber(potencia_kWp, 3)}),
            xaxis: {
                title: i18next.t('graficos_LBL_paneles')
            },
            yaxis: {
                title: '%'
            },
            yaxis2: {
                title: 'Euros',
                overlaying: 'y',
                side: 'right'
            },
            legend: {
                x:1.1, y:1.,
                orientation:'v'
            },
            shapes: [
                  {
                    type: 'line',
                    x0: TCB.instalacion.paneles, y0: 0,
                    x1: TCB.instalacion.paneles, y1: prodvscons[prodvscons.length-1],
                    line: {color: 'rgb(55, 128, 191)', width: 3}
                  },
                    {
                    type: 'line',
                    x0: 0, y0: 80,
                    x1: limiteSubvencion, y1: 80,
                    line: {color: 'rgb(87, 202, 0)', width: 2}
                    },
                    {
                    type: 'line',
                    x0: limiteSubvencion, y0: 0,
                    x1: limiteSubvencion, y1: 80,
                    line: {color: 'rgb(87, 202, 0)', width: 2}
                    }
                ],
            annotations: [
                {
                    x: limiteSubvencion, y: 80,
                    xref: 'x', yref: 'y',
                    text: i18next.t("precios_LBL_subvencionEU"),
                    showarrow: true,
                    arrowhead: 3,
                    xanchor: 'left',
                    hovertext: limiteSubvencion.toFixed(1) + " " + i18next.t("graficos_LBL_paneles"),
                    ax: 20,
                    ay: 0
                },
                {
                    x: TCB.instalacion.paneles, y: prodvscons[prodvscons.length-1],
                    xref: 'x', yref: 'y',
                    text: i18next.t("graficos_LBL_paneles"),
                    showarrow: true,
                    arrowhead: 2,
                    xanchor: 'left',
                    hovertext: i18next.t("graficos_LBL_panelesActuales",{paneles: TCB.instalacion.paneles}),
                    ax: 20,
                    ay: -20
                }]
        };

        var data = [trace_TIR, trace_autoconsumo, trace_prodvscons, trace_precioInstalacion, trace_ahorroAnual];
        Plotly.react(donde, data, layout)

        var gd = document.getElementById(donde);
        var xInDataCoord;
        var yInDataCoord;
        var xaxis = gd._fullLayout.xaxis;
        var yaxis = gd._fullLayout.yaxis;
        var l = gd._fullLayout.margin.l;
        var t = gd._fullLayout.margin.t;
        var r = gd._fullLayout.margin.r;
        var w = gd._fullLayout.margin.width;
    
        gd.addEventListener('click', function(evt) {
            document.getElementById("numeroPaneles").value =  Math.round(xInDataCoord);
            Dispatch("Cambio instalacion");
        });
        
        gd.addEventListener('mousemove', function(evt) {
            xInDataCoord = xaxis.p2c(evt.x - l);
            yInDataCoord = yaxis.p2c(evt.y - t);
            // Se limita el número de paneles que se puede seleccionar del gráfico desde 1 al máximo mostrado
            if (Math.round(xInDataCoord) > 0 && Math.round(xInDataCoord) <= paneles[paneles.length - 1]) {
                Plotly.relayout(gd, 'title', 
                    [i18next.t('graficos_LBL_alternativasPotencia', {potencia: UTIL.formatNumber(potencia_kWp, 3)}), 
                    i18next.t('graficos_LBL_cambiaPaneles', {paneles: Math.round(xInDataCoord)})].join("<br>"));
            }
        });
    };

}
