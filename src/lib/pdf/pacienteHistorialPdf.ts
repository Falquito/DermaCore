// src/lib/pdf/pacienteHistorialPdf.ts
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import type { Paciente, Consultas, ObraSocial, Coseguro } from "@prisma/client";

export type ConsultaConRelaciones = Consultas & {
  obraSocial?: ObraSocial | null;
  coseguro?: Coseguro | null;
};

function formatFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function writeSection(
  doc: PDFKit.PDFDocument,
  title: string,
  value?: string | null,
  options?: { showIfNull?: boolean }
) {
  if (!value && !options?.showIfNull) return;

  doc.font("Helvetica-Bold").text(`${title}:`);
  doc
    .font("Helvetica")
    .text(value ?? "No se rellenó este apartado")
    .moveDown(0.5);
}

export function generatePacienteHistorialPdf(params: {
  paciente: Paciente;
  consultas: ConsultaConRelaciones[];
}) {
  const { paciente, consultas } = params;

  const doc = new PDFDocument({ margin: 50, size: "A4" });

  // ---- Header ----
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("Historia Clínica del Paciente", { align: "center" })
    .moveDown();

  doc.fontSize(11).font("Helvetica");

  doc.text(`Nombre: ${paciente.apellidoPaciente}, ${paciente.nombrePaciente}`);
  doc.text(`DNI: ${paciente.dniPaciente}`);

  if (paciente.telefonoPaciente) {
    doc.text(`Teléfono: ${paciente.telefonoPaciente}`);
  }

  if (paciente.domicilioPaciente) {
    doc.text(`Domicilio: ${paciente.domicilioPaciente}`);
  }

  doc.text(`Fecha de alta: ${formatFecha(paciente.fechaHoraPaciente)}`);
  doc.text(`Estado: ${paciente.estadoPaciente ? "Activo" : "Inactivo"}`);

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  // ---- Resumen ----
  if (consultas.length > 0) {
    doc.font("Helvetica-Bold").text("Resumen de consultas").moveDown(0.5);

    doc.font("Helvetica");
    doc.text(`Total de consultas: ${consultas.length}`);
    doc.text(`Primera consulta: ${formatFecha(consultas[0].fechaHoraConsulta)}`);
    doc.text(
      `Última consulta: ${formatFecha(
        consultas[consultas.length - 1].fechaHoraConsulta
      )}`
    );
  } else {
    doc.font("Helvetica").text("El paciente no registra consultas.");
  }

  doc.moveDown();

  // ---- Detalle de consultas ----
  consultas.forEach((consulta, index) => {
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .text(
        `Consulta #${index + 1} – ${formatFecha(consulta.fechaHoraConsulta)}`
      )
      .moveDown(0.5);

    doc.fontSize(11).font("Helvetica");
    doc.text(`Tipo de consulta: ${consulta.tipoConsulta}`);

    if (consulta.obraSocial) {
      doc.text(`Obra social: ${consulta.obraSocial.nombreObraSocial}`);
      if (consulta.nroAfiliado) {
        doc.text(`N° Afiliado: ${consulta.nroAfiliado}`);
      }
    }

    if (consulta.coseguro) {
      doc.text(`Coseguro: ${consulta.coseguro.nombreCoseguro}`);
    }

    if (consulta.montoConsulta) {
      doc.text(`Monto: $${consulta.montoConsulta}`);
    }

    doc.moveDown(0.5);

    writeSection(doc, "Motivo de consulta", consulta.motivoConsulta);
    writeSection(doc, "Diagnóstico", consulta.diagnosticoConsulta, {
      showIfNull: true,
    });
    writeSection(doc, "Tratamiento", consulta.tratamientoConsulta, {
      showIfNull: true,
    });
    writeSection(
      doc,
      "Estudios complementarios",
      consulta.estudiosComplementarios
    );

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
  });

  return doc;
}
