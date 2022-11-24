import TCB from "./TCB.js";

export default class Instalacion {

  constructor(paneles, potenciaUnitaria, precioUnitarioInstalacion) {
    this.potenciaUnitaria = potenciaUnitaria;
    this.paneles = paneles;
    this.precioUnitarioInstalacion = precioUnitarioInstalacion;

  }

  potenciaTotal() {
    return this.potenciaUnitaria * this.paneles;
  }

  precioInstalacion() {
    let i = 0;
    while (this.potenciaTotal() > TCB.precioInstalacion.precios[i].desde ) {
       i++;
    }
    let precioFinal = this.potenciaTotal() * TCB.precioInstalacion.precios[i-1].precio * (1 + TCB.parametros.IVAinstalacion / 100);
    return precioFinal;
  }

  precioInstalacionCorregido () {
    let incremento = (100. + TCB.correccionPrecioInstalacion) / 100.;
    return this.precioInstalacion() * incremento;
  }
}
