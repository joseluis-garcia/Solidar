# Historial de versiones:

## 20221010: Primera version de Solidar

## 20221011: 
- Modificación llamada Nominatim para que devuelva siempre el texto en español
- Añadido de la potencia inicial de paneles a TCB.parametros
- Las tarifas se cargan desde el fichero <urlbase>:/datos/tarifas.json 
- Posibilidad de cargar tarifas desde fichero local

## 20221013:
- Cambio definicion de limite subvencion con cociente minimo de Consumo / Produccion > 80%
- Cambio en la gráfica de alternativas volviendo a incluir autosuficiencia

## 20221017:
- Las instrucciones aparecen en una pestaña nueva y no en la isma ventana
- Modificación precios SOM Energia en tarifas.json
- Se crea la version indexNoEntero donde se puede poner un numero no entero de paneles para el cálculo. Aun no se modifica el gráfico de alternativas que sigue siendo un número entero
- Se incluyen los ficheros detallados de carga de CSV para I-DE y Naturgy

## 20221024:
- Se modficia la carga de CSV para prever que puedan venir registros vacios al final del fichero (detectado en Naturgy Santa Ana)
- Modificación unidades potencia disponible a kWp en balance energia y reporte.
- Se añade un número al nombre de la pestaña para dejar mas claro que el proceso es una secuencia
- Se modifican los nombres de los campos en el balance de energia para darle mas coherencia y se añaden los tooltips

## 20221031:
- Se quita la limitación de un número entero de paneles
- Se añaden las instruccicones detalladas de como obtener el CSV en el portal de VIESGO
- Nueva forma de calcular los precios de la instalación según tabla json
- Modificación del cálculo de subvención EU
- Se añade pantalla de bienvenida
- Se añade limitación de responsabilidad en el report pdf


