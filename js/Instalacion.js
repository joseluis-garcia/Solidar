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
    return this.potenciaTotal() * TCB.parametros.euroxkWpinstalado * (1 + TCB.parametros.IVA / 100);
  }
}
