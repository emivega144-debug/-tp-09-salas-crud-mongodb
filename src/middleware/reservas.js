const { SALAS_PERMITIDAS, TURNOS_PERMITIDOS } = require("../modelos/reserva");

function prepararAreaReservas(req, res, next) {
  res.locals.seccion = "Reservas de salas";
  res.locals.salas = SALAS_PERMITIDAS;
  res.locals.turnos = TURNOS_PERMITIDOS;
  next();
}

function responderInvalido(req, res, mensaje, valores) {
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(400).json({ error: mensaje });
  }
  return res.status(400).render("reservas/nueva", {
    titulo: "Nueva reserva",
    error: mensaje,
    valores,
  });
}

function validarReserva(req, res, next) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return responderInvalido(
      req,
      res,
      "El cuerpo de la solicitud es obligatorio y debe contener los datos de la reserva.",
      {},
    );
  }

  const valores = req.body;
  const permitidos =
    req.method === "PUT"
      ? ["estudiante", "email", "sala", "fecha", "turno", "personas", "estado"]
      : ["estudiante", "email", "sala", "fecha", "turno", "personas"];

  for (const campo of Object.keys(valores)) {
    if (!permitidos.includes(campo)) {
      return responderInvalido(
        req,
        res,
        `El campo ${campo} no está permitido en esta operación.`,
        valores,
      );
    }
  }

  const estudiante =
    typeof valores.estudiante === "string" ? valores.estudiante.trim() : "";
  const email = typeof valores.email === "string" ? valores.email.trim() : "";
  const sala = typeof valores.sala === "string" ? valores.sala.trim() : "";
  const fecha = typeof valores.fecha === "string" ? valores.fecha.trim() : "";
  const turno = typeof valores.turno === "string" ? valores.turno.trim() : "";

  const personasRecibidas = valores.personas;
  const tipoPersonasValido =
    typeof personasRecibidas === "number" ||
    (typeof personasRecibidas === "string" && personasRecibidas.trim() !== "");
  const personas = tipoPersonasValido ? Number(personasRecibidas) : NaN;

  if (!estudiante) {
    return responderInvalido(
      req,
      res,
      "El nombre del estudiante es obligatorio.",
      valores,
    );
  }

  if (!email || !email.includes("@")) {
    return responderInvalido(
      req,
      res,
      "Ingresá un correo electrónico válido con @.",
      valores,
    );
  }

  if (!SALAS_PERMITIDAS.includes(sala)) {
    return responderInvalido(
      req,
      res,
      "Seleccioná una sala permitida (Sala Norte, Sala Sur o Sala Multimedia).",
      valores,
    );
  }

  if (!fecha) {
    return responderInvalido(
      req,
      res,
      "La fecha de la reserva es obligatoria.",
      valores,
    );
  }

  if (!TURNOS_PERMITIDOS.includes(turno)) {
    return responderInvalido(
      req,
      res,
      "Seleccioná un turno permitido (Mañana, Tarde o Noche).",
      valores,
    );
  }

  if (!Number.isInteger(personas) || personas < 1 || personas > 6) {
    return responderInvalido(
      req,
      res,
      "La cantidad de personas debe ser un número entero entre 1 y 6.",
      valores,
    );
  }

  req.reservaValidada = {
    estudiante,
    email,
    sala,
    fecha,
    turno,
    personas,
  };

  next();
}

module.exports = { prepararAreaReservas, validarReserva };
