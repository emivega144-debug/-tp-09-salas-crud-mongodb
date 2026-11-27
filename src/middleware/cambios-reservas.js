function normalizarPersonas(valor) {
  if (typeof valor === "number") {
    return Number.isFinite(valor) && Number.isInteger(valor) ? valor : null;
  }
  if (typeof valor === "string") {
    const limpio = valor.trim();
    if (!limpio || !/^-?\d+$/.test(limpio)) {
      return null;
    }
    const numero = Number(limpio);
    return Number.isFinite(numero) && Number.isInteger(numero) ? numero : null;
  }
  return null;
}

function validarReemplazoReserva(req, res, next) {
  const datos = req.body;
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return res.status(400).json({ error: "Enviá un objeto JSON." });
  }

  const permitidos = [
    "estudiante",
    "email",
    "sala",
    "fecha",
    "turno",
    "personas",
    "estado",
  ];
  const obligatorios = [...permitidos];

  for (const campo of Object.keys(datos)) {
    if (!permitidos.includes(campo)) {
      return res
        .status(400)
        .json({ error: `El campo ${campo} no se puede modificar.` });
    }
  }

  for (const campo of obligatorios) {
    if (!Object.hasOwn(datos, campo)) {
      return res
        .status(400)
        .json({ error: `Falta el campo obligatorio ${campo}.` });
    }
  }

  const personas = normalizarPersonas(datos.personas);
  if (personas === null || personas < 1 || personas > 6) {
    return res
      .status(400)
      .json({ error: "Personas debe ser un entero entre 1 y 6." });
  }

  if (datos.estado !== "pendiente" && datos.estado !== "confirmada") {
    return res
      .status(400)
      .json({ error: "Estado debe ser pendiente o confirmada." });
  }

  const base = req.reservaValidada ?? {};
  req.cambiosValidos = {
    estudiante: base.estudiante ?? datos.estudiante,
    email: base.email ?? datos.email,
    sala: base.sala ?? datos.sala,
    fecha: base.fecha ?? datos.fecha,
    turno: base.turno ?? datos.turno,
    personas,
    estado: datos.estado,
  };

  return next();
}

function validarActualizacionReserva(req, res, next) {
  const datos = req.body;
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return res.status(400).json({ error: "Enviá un objeto JSON." });
  }

  for (const campo of Object.keys(datos)) {
    if (campo !== "personas" && campo !== "estado") {
      return res
        .status(400)
        .json({ error: "Solo se puede cambiar personas o estado." });
    }
  }

  if (datos.personas === undefined && datos.estado === undefined) {
    return res.status(400).json({ error: "Enviá personas o estado." });
  }

  const cambios = {};

  if (datos.personas !== undefined) {
    const personas = normalizarPersonas(datos.personas);
    if (personas === null || personas < 1 || personas > 6) {
      return res
        .status(400)
        .json({ error: "Personas debe ser un entero entre 1 y 6." });
    }
    cambios.personas = personas;
  }

  if (datos.estado !== undefined) {
    if (datos.estado !== "pendiente" && datos.estado !== "confirmada") {
      return res
        .status(400)
        .json({ error: "Estado debe ser pendiente o confirmada." });
    }
    cambios.estado = datos.estado;
  }

  req.cambiosValidos = cambios;
  return next();
}

module.exports = {
  validarReemplazoReserva,
  validarActualizacionReserva,
};
