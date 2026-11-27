const mongoose = require("mongoose");

const SALAS_PERMITIDAS = ["Sala Norte", "Sala Sur", "Sala Multimedia"];
const TURNOS_PERMITIDOS = ["Mañana", "Tarde", "Noche"];
const ESTADOS_PERMITIDOS = ["pendiente", "confirmada"];

const reservaSchema = new mongoose.Schema(
  {
    estudiante: {
      type: String,
      required: [true, "El nombre del estudiante es obligatorio."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El email es obligatorio."],
      trim: true,
      match: [/@/, "El email debe contener el carácter @."],
    },
    sala: {
      type: String,
      required: [true, "La sala es obligatoria."],
      enum: {
        values: SALAS_PERMITIDAS,
        message: "La sala seleccionada no es válida.",
      },
    },
    fecha: {
      type: String,
      required: [true, "La fecha es obligatoria."],
      trim: true,
    },
    turno: {
      type: String,
      required: [true, "El turno es obligatorio."],
      enum: {
        values: TURNOS_PERMITIDOS,
        message: "El turno seleccionado no es válido.",
      },
    },
    personas: {
      type: Number,
      required: [true, "La cantidad de personas es obligatoria."],
      min: [1, "Debe haber al menos 1 persona."],
      max: [6, "El máximo permitido es de 6 personas."],
      validate: {
        validator: Number.isInteger,
        message: "La cantidad de personas debe ser un número entero.",
      },
    },
    estado: {
      type: String,
      enum: {
        values: ESTADOS_PERMITIDOS,
        message: "El estado de la reserva no es válido.",
      },
      default: "pendiente",
    },
  },
  {
    collection: "reservas",
  },
);

const Reserva = mongoose.model("Reserva", reservaSchema);

module.exports = {
  Reserva,
  SALAS_PERMITIDAS,
  TURNOS_PERMITIDOS,
  ESTADOS_PERMITIDOS,
};
