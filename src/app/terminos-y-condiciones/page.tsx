// src/app/terminos-y-condiciones/page.tsx

import { ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Términos y Condiciones | DermaCore",
  description:
    "Términos y Condiciones de uso del sistema DermaCore para gestión de pacientes y consultas.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "21 de enero de 2026";

const sections = [
  { id: "objeto", title: "1. Objeto del servicio" },
  { id: "alcance", title: "2. Alcance del sistema y modificaciones" },
  { id: "usuarios", title: "3. Usuarios habilitados" },
  { id: "responsabilidad", title: "4. Responsabilidad del usuario" },
  { id: "datos-pacientes", title: "5. Información médica y datos de pacientes" },
  { id: "proteccion-datos", title: "6. Protección de datos personales" },
  { id: "limitacion", title: "7. Limitación de responsabilidad" },
  { id: "disponibilidad", title: "8. Disponibilidad del servicio" },
  { id: "propiedad", title: "9. Propiedad intelectual" },
  { id: "suspension", title: "10. Suspensión o cancelación de cuentas" },
  { id: "modificaciones", title: "11. Modificaciones de los términos" },
  { id: "contacto", title: "12. Contacto" },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function TerminosYCondicionesPage() {
  return (
    <div className="py-10 sm:py-12">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <ScrollText className="h-6 w-6 text-muted-foreground text-sky-500" />

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Términos y Condiciones de Uso
          </h1>
        </div>

        <p className="text-sm sm:text-base text-muted-foreground">
          <span className="font-medium text-foreground">
            Última actualización:
          </span>{" "}
          {LAST_UPDATED}
        </p>

        <div className="rounded-lg border bg-background p-4 sm:p-5 text-sm sm:text-base text-muted-foreground">
          <p className="leading-relaxed">
            Bienvenido/a a{" "}
            <span className="font-medium text-foreground">DermaCore</span>. Al
            acceder y utilizar este sistema, usted acepta quedar vinculado por
            los presentes{" "}
            <span className="font-medium text-foreground">
              Términos y Condiciones
            </span>
            . Si no está de acuerdo con alguno de ellos, deberá abstenerse de
            utilizar la plataforma.
          </p>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Índice (sticky en desktop) */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-lg border bg-background p-4">
            <p className="text-sm font-medium">Índice</p>
            <nav className="mt-3">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="hover:text-foreground underline-offset-4 hover:underline"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Contenido */}
        <main className="space-y-8">
          <Section id="objeto" title="1. Objeto del servicio">
            <p>
              DermaCore es un sistema de{" "}
              <span className="font-medium text-foreground">
                gestión administrativa y clínica
              </span>{" "}
              destinado a profesionales y centros de salud, que permite
              administrar información de pacientes, consultas, obras sociales y
              datos relacionados con la práctica médica.
            </p>
            <p>
              El sistema{" "}
              <span className="font-medium text-foreground">no reemplaza</span>{" "}
              el criterio médico profesional, ni realiza diagnósticos
              automáticos.
            </p>
          </Section>

          <Section id="alcance" title="2. Alcance del sistema y modificaciones">
            <p>
              El sistema DermaCore ha sido desarrollado como una{" "}
              <span className="font-medium text-foreground">solución a medida</span>{" "}
              de acuerdo con los requerimientos y funcionalidades definidos y
              aceptados previamente entre las partes.
            </p>

            <p>
              El correcto funcionamiento del sistema se garantiza{" "}
              <span className="font-medium text-foreground">
                exclusivamente dentro del alcance acordado
              </span>
              , no incluyendo funcionalidades, ajustes o comportamientos que no
              hayan sido expresamente contemplados en dicho alcance.
            </p>

            <p>
              Cualquier modificación, mejora, ajuste o cambio solicitado con
              posterioridad a la entrega del sistema que exceda el alcance
              original{" "}
              <span className="font-medium text-foreground">
                deberá ser presupuestado y aprobado de manera independiente
              </span>
              .
            </p>

            <p>
              La incorporación de nuevas funcionalidades, módulos adicionales o
              ampliaciones del sistema será considerada como una{" "}
              <span className="font-medium text-foreground">
                nueva etapa o versión del proyecto
              </span>
              , sujeta a nuevos plazos, condiciones y presupuesto.
            </p>
          </Section>

          <Section id="usuarios" title="3. Usuarios habilitados">
            <p>El uso del sistema está destinado exclusivamente a:</p>
            <ul className="list-disc pl-9 space-y-1">
              <li>Profesionales de la salud</li>
              <li>Personal autorizado por una institución médica</li>
              <li>Administradores debidamente registrados</li>
            </ul>
            <p>
              El usuario declara que la información suministrada durante el
              registro es{" "}
              <span className="font-medium text-foreground">
                veraz, actual y completa
              </span>
              .
            </p>
          </Section>

          <Section id="responsabilidad" title="4. Responsabilidad del usuario">
            <p>El usuario se compromete a:</p>
            <ul className="list-disc pl-9 space-y-1">
              <li>Utilizar el sistema de forma lícita y profesional</li>
              <li>Mantener la confidencialidad de sus credenciales de acceso</li>
              <li>No compartir usuarios ni contraseñas</li>
              <li>Registrar información clínica y administrativa de forma correcta</li>
            </ul>
            <p>
              El usuario es{" "}
              <span className="font-medium text-foreground">
                único responsable
              </span>{" "}
              por toda actividad realizada desde su cuenta.
            </p>
          </Section>

          <Section
            id="datos-pacientes"
            title="5. Información médica y datos de pacientes"
          >
            <p>
              El sistema permite almacenar{" "}
              <span className="font-medium text-foreground">
                datos personales y datos sensibles
              </span>
              , incluyendo información médica.
            </p>
            <p>
              El usuario declara contar con autorización legal, consentimiento
              del paciente y cumplimiento de la normativa vigente en materia de
              protección de datos, en la medida que corresponda.
            </p>
            <p>
              DermaCore actúa únicamente como{" "}
              <span className="font-medium text-foreground">
                herramienta tecnológica
              </span>
              , no como responsable del contenido cargado por los usuarios.
            </p>
          </Section>

          <Section
            id="proteccion-datos"
            title="6. Protección de datos personales"
          >
            <p>
              Los datos almacenados en el sistema son tratados de forma
              confidencial y con medidas de seguridad razonables.
            </p>
            <p>
              El usuario se compromete a cumplir con la legislación vigente en
              materia de protección de datos personales, incluyendo —cuando
              corresponda— la normativa aplicable en la{" "}
              <span className="font-medium text-foreground">
                República Argentina
              </span>
              .
            </p>
            <p>
              LSLC Software no compartirá información con terceros, salvo
              obligación legal o requerimiento judicial.
            </p>
          </Section>

          <Section id="limitacion" title="7. Limitación de responsabilidad">
            <p>
              LSLC Software{" "}
              <span className="font-medium text-foreground">no garantiza</span>{" "}
              que el sistema esté libre de errores, interrupciones o fallas
              técnicas. En caso de que ocurra algún inconveniente anteriormente
              mencionado, es responsabilidad de LSLC Software y se trabajará
              para resolverlo a la brevedad posible.
            </p>
            <p>En ningún caso LSLC Software será responsable por:</p>
            <ul className="list-disc pl-9 space-y-1">
              <li>Decisiones médicas tomadas por los usuarios</li>
              <li>Pérdida de información causada por uso indebido</li>
              <li>Daños directos o indirectos derivados del uso del sistema</li>
            </ul>
            <p>
              El uso del sistema se realiza{" "}
              <span className="font-medium text-foreground">
                bajo exclusiva responsabilidad
              </span>{" "}
              del usuario.
            </p>
          </Section>

          <Section id="disponibilidad" title="8. Disponibilidad del servicio">
            <p>LSLC Software se reserva el derecho de:</p>
            <ul className="list-disc pl-9 space-y-1">
              <li>Modificar o actualizar funcionalidades</li>
              <li>Suspender temporalmente el servicio por mantenimiento</li>
              <li>
                Interrumpir el acceso ante uso indebido o violaciones a estos
                términos
              </li>
            </ul>
          </Section>

          <Section id="propiedad" title="9. Propiedad intelectual">
            <p>
              Todo el contenido del sistema, incluyendo código, diseño, logotipos
              y textos, es propiedad de LSLC Software.
            </p>
            <p>
              Queda prohibida la reproducción, distribución o modificación sin
              autorización.
            </p>
          </Section>

          <Section id="suspension" title="10. Suspensión o cancelación de cuentas">
            <p>LSLC Software podrá suspender o cancelar cuentas que:</p>
            <ul className="list-disc pl-9 space-y-1">
              <li>Incumplan estos Términos y Condiciones</li>
              <li>Utilicen el sistema con fines ilegales</li>
              <li>Comprometan la seguridad o integridad de la plataforma</li>
            </ul>
          </Section>

          <Section id="modificaciones" title="11. Modificaciones de los términos">
            <p>
              LSLC Software podrá actualizar estos Términos y Condiciones en
              cualquier momento. Las modificaciones entrarán en vigencia desde
              su publicación y se dara aviso.
            </p>
            <p>
              Se recalca que el uso continuado del sistema implica la aceptación
              de los cambios.
            </p>
          </Section>

          <Section id="contacto" title="12. Contacto">
            <p>
              Para consultas relacionadas con estos Términos y Condiciones, puede
              comunicarse a través de los canales oficiales de LSLC Software.
            </p>
          </Section>

          <footer className="rounded-lg border bg-background p-4 sm:p-5">
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Al utilizar DermaCore, usted declara haber leído, comprendido y
              aceptado estos Términos y Condiciones en su totalidad.
            </p>
          </footer>

          <p className="text-xs sm:text-sm">
            <Link href="/" className="underline underline-offset-4 hover:text-foreground">
              Volver al inicio
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
