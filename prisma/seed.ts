import { PrismaClient, Role, AppointmentStatus, DayOfWeek, TipoConsulta } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Comenzando seed con datos extensos...')

  const password = await bcrypt.hash('admin1234', 10)
  
  // Primero crear especialidades
  console.log('📋 Creando especialidades...')
  const especialidades = [
    { nombre: 'Cardiología', descripcion: 'Especialidad médica que se dedica al estudio, diagnóstico y tratamiento de las enfermedades del corazón y del aparato circulatorio' },
    { nombre: 'Dermatología', descripcion: 'Especialidad médica que se dedica al estudio de la estructura y función de la piel' },
    { nombre: 'Pediatría', descripcion: 'Especialidad médica que estudia al niño y sus enfermedades' },
    { nombre: 'Ginecología', descripcion: 'Especialidad médica que trata las enfermedades del sistema reproductor femenino' },
    { nombre: 'Traumatología', descripcion: 'Especialidad médica que se dedica al estudio de las lesiones del aparato locomotor' },
    { nombre: 'Neurología', descripcion: 'Especialidad médica que trata los trastornos del sistema nervioso' },
    { nombre: 'Oftalmología', descripcion: 'Especialidad médica que estudia las enfermedades de los ojos' },
    { nombre: 'Otorrinolaringología', descripcion: 'Especialidad médica que se encarga de la prevención, diagnóstico y tratamiento de las enfermedades del oído, nariz y garganta' },
    { nombre: 'Psiquiatría', descripcion: 'Especialidad médica dedicada al estudio de los trastornos mentales' },
    { nombre: 'Medicina General', descripcion: 'Atención médica integral y continua del individuo, la familia y la comunidad' },
    { nombre: 'Gastroenterología', descripcion: 'Especialidad médica que se ocupa de todo lo relacionado con el aparato digestivo' },
    { nombre: 'Endocrinología', descripcion: 'Especialidad médica que estudia las hormonas y las enfermedades que estas provocan' }
  ]

  const especialidadesCreadas = []
  for (const esp of especialidades) {
    const especialidadCreada = await prisma.especialidad.upsert({
      where: { nombre: esp.nombre },
      update: esp,
      create: esp
    })
    especialidadesCreadas.push(especialidadCreada)
  }

  // Crear usuarios profesionales más extensos
  console.log('👨‍⚕️ Creando profesionales...')
  const profesionales = [
    { email: 'ana.cardiologa@carelink.com', name: 'Ana María', apellido: 'González', dni: '12345678', telefono: '11-4123-4567', especialidad: 'Cardiología' },
    { email: 'luis.dermatologo@carelink.com', name: 'Luis Eduardo', apellido: 'Martínez', dni: '23456789', telefono: '11-4234-5678', especialidad: 'Dermatología' },
    { email: 'maria.pediatra@carelink.com', name: 'María José', apellido: 'Rodríguez', dni: '34567890', telefono: '11-4345-6789', especialidad: 'Pediatría' },
    { email: 'carlos.traumatologo@carelink.com', name: 'Carlos Alberto', apellido: 'López', dni: '45678901', telefono: '11-4456-7890', especialidad: 'Traumatología' },
    { email: 'sofia.ginecologa@carelink.com', name: 'Sofía Elena', apellido: 'Fernández', dni: '56789012', telefono: '11-4567-8901', especialidad: 'Ginecología' },
    { email: 'diego.neurologo@carelink.com', name: 'Diego Andrés', apellido: 'García', dni: '67890123', telefono: '11-4678-9012', especialidad: 'Neurología' },
    { email: 'laura.oftalmologa@carelink.com', name: 'Laura Beatriz', apellido: 'Sánchez', dni: '78901234', telefono: '11-4789-0123', especialidad: 'Oftalmología' },
    { email: 'roberto.otorrino@carelink.com', name: 'Roberto Carlos', apellido: 'Díaz', dni: '89012345', telefono: '11-4890-1234', especialidad: 'Otorrinolaringología' },
    { email: 'elena.psiquiatra@carelink.com', name: 'Elena Victoria', apellido: 'Torres', dni: '90123456', telefono: '11-4901-2345', especialidad: 'Psiquiatría' },
    { email: 'juan.medico.general@carelink.com', name: 'Juan Pablo', apellido: 'Morales', dni: '01234567', telefono: '11-4012-3456', especialidad: 'Medicina General' },
    { email: 'patricia.gastro@carelink.com', name: 'Patricia Inés', apellido: 'Vega', dni: '11234568', telefono: '11-4123-4568', especialidad: 'Gastroenterología' },
    { email: 'fernando.endocrino@carelink.com', name: 'Fernando José', apellido: 'Silva', dni: '21345679', telefono: '11-4234-5679', especialidad: 'Endocrinología' }
  ]

  // Crear usuarios base (mantener los existentes)
  const users: Array<{ email: string; name: string; apellido?: string; dni?: string; telefono?: string; role: Role; passwordHash: string; especialidadNombre?: string }> = [
    { email: 'mesa@carelink.com', name: 'Mesa', apellido: 'Entrada', dni: '20000000', telefono: '11-4000-0000', role: 'MESA_ENTRADA', passwordHash: password },
    { email: 'gerente@carelink.com', name: 'Gerente', apellido: 'Sistema', dni: '20000001', telefono: '11-4000-0001', role: 'GERENTE', passwordHash: password },
    ...profesionales.map(prof => ({
      email: prof.email,
      name: prof.name,
      apellido: prof.apellido,
      dni: prof.dni,
      telefono: prof.telefono,
      role: 'PROFESIONAL' as Role,
      passwordHash: password,
      especialidadNombre: prof.especialidad
    }))
  ]

  // Crear/actualizar usuarios
  console.log('👥 Creando usuarios...')
  const usuariosCreados = []
  for (const u of users) {
    const especialidad = u.especialidadNombre ? 
      especialidadesCreadas.find(esp => esp.nombre === u.especialidadNombre) : null

    const usuario = await prisma.user.upsert({
      where: { email: u.email },
      update: { 
        passwordHash: u.passwordHash, 
        role: u.role, 
        name: u.name,
        apellido: u.apellido,
        dni: u.dni,
        telefono: u.telefono,
        especialidadId: especialidad?.id 
      },
      create: { 
        email: u.email, 
        name: u.name, 
        apellido: u.apellido,
        dni: u.dni,
        telefono: u.telefono,
        role: u.role, 
        passwordHash: u.passwordHash,
        especialidadId: especialidad?.id
      },
    })
    usuariosCreados.push(usuario)
  }

  // Crear horarios para profesionales
  console.log('🕐 Creando horarios profesionales...')
  const profesionalesCreados = usuariosCreados.filter(u => u.role === 'PROFESIONAL')
  
  for (const prof of profesionalesCreados) {
    // Horarios típicos de lunes a viernes 8:00-17:00 con diferentes variaciones
    const horarios = [
      { dayOfWeek: DayOfWeek.LUNES, startTime: '08:00', endTime: '17:00' },
      { dayOfWeek: DayOfWeek.MARTES, startTime: '08:00', endTime: '17:00' },
      { dayOfWeek: DayOfWeek.MIERCOLES, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: DayOfWeek.JUEVES, startTime: '08:00', endTime: '17:00' },
      { dayOfWeek: DayOfWeek.VIERNES, startTime: '08:00', endTime: '16:00' },
    ]

    for (const horario of horarios) {
      await prisma.professionalSchedule.upsert({
        where: {
          userId_dayOfWeek: {
            userId: prof.id,
            dayOfWeek: horario.dayOfWeek
          }
        },
        update: horario,
        create: {
          userId: prof.id,
          ...horario
        }
      })
    }
  }

  // Obtener usuario mesa de entrada
  const mesa = usuariosCreados.find(u => u.role === 'MESA_ENTRADA')

  // Crear pacientes extensos con datos argentinos realistas
  console.log('🏥 Creando pacientes...')
  const pacientesData = [
    { nombre: 'Juan Carlos', apellido: 'Pérez', dni: '12345678', fechaNacimiento: new Date('1990-01-15'), genero: 'M', telefono: '11-5123-4567', celular: '11-6123-4567', email: 'juan.perez@email.com', direccion: 'Av. Corrientes 1234', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1043' },
    { nombre: 'María Eugenia', apellido: 'Gómez', dni: '23456789', fechaNacimiento: new Date('1985-03-22'), genero: 'F', telefono: '11-5234-5678', celular: '11-6234-5678', email: 'maria.gomez@email.com', direccion: 'Av. Santa Fe 2345', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1123' },
    { nombre: 'Roberto Daniel', apellido: 'Martínez', dni: '34567890', fechaNacimiento: new Date('1978-07-10'), genero: 'M', telefono: '11-5345-6789', celular: '11-6345-6789', email: 'roberto.martinez@email.com', direccion: 'Av. Rivadavia 3456', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1203' },
    { nombre: 'Ana Carolina', apellido: 'López', dni: '45678901', fechaNacimiento: new Date('1992-11-05'), genero: 'F', telefono: '11-5456-7890', celular: '11-6456-7890', email: 'ana.lopez@email.com', direccion: 'Av. Callao 4567', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1022' },
    { nombre: 'Carlos Alberto', apellido: 'Rodríguez', dni: '56789012', fechaNacimiento: new Date('1982-09-18'), genero: 'M', telefono: '11-5567-8901', celular: '11-6567-8901', email: 'carlos.rodriguez@email.com', direccion: 'Av. 9 de Julio 5678', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1047' },
    { nombre: 'Sofía Valentina', apellido: 'González', dni: '67890123', fechaNacimiento: new Date('1995-04-12'), genero: 'F', telefono: '11-5678-9012', celular: '11-6678-9012', email: 'sofia.gonzalez@email.com', direccion: 'Av. Las Heras 6789', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1425' },
    { nombre: 'Diego Sebastián', apellido: 'Fernández', dni: '78901234', fechaNacimiento: new Date('1988-12-30'), genero: 'M', telefono: '11-5789-0123', celular: '11-6789-0123', email: 'diego.fernandez@email.com', direccion: 'Av. Córdoba 7890', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1054' },
    { nombre: 'Laura Beatriz', apellido: 'García', dni: '89012345', fechaNacimiento: new Date('1975-06-08'), genero: 'F', telefono: '11-5890-1234', celular: '11-6890-1234', email: 'laura.garcia@email.com', direccion: 'Av. Belgrano 8901', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1092' },
    { nombre: 'Alejandro Miguel', apellido: 'Sánchez', dni: '90123456', fechaNacimiento: new Date('1993-08-25'), genero: 'M', telefono: '11-5901-2345', celular: '11-6901-2345', email: 'alejandro.sanchez@email.com', direccion: 'Av. Pueyrredón 9012', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1118' },
    { nombre: 'Valeria Andrea', apellido: 'Díaz', dni: '01234567', fechaNacimiento: new Date('1987-02-14'), genero: 'F', telefono: '11-5012-3456', celular: '11-6012-3456', email: 'valeria.diaz@email.com', direccion: 'Av. Independencia 0123', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1225' },
    { nombre: 'Matías Esteban', apellido: 'Torres', dni: '11234568', fechaNacimiento: new Date('1991-10-03'), genero: 'M', telefono: '11-5123-4568', celular: '11-6123-4568', email: 'matias.torres@email.com', direccion: 'Av. San Martín 1123', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1004' },
    { nombre: 'Florencia Micaela', apellido: 'Morales', dni: '21345679', fechaNacimiento: new Date('1996-05-20'), genero: 'F', telefono: '11-5234-5679', celular: '11-6234-5679', email: 'florencia.morales@email.com', direccion: 'Av. Cabildo 2134', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1426' },
    { nombre: 'Federico Ignacio', apellido: 'Vega', dni: '31456790', fechaNacimiento: new Date('1984-01-07'), genero: 'M', telefono: '11-5345-6790', celular: '11-6345-6790', email: 'federico.vega@email.com', direccion: 'Av. Medrano 3145', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1179' },
    { nombre: 'Camila Soledad', apellido: 'Silva', dni: '41567901', fechaNacimiento: new Date('1989-09-16'), genero: 'F', telefono: '11-5456-7901', celular: '11-6456-7901', email: 'camila.silva@email.com', direccion: 'Av. Juan B. Justo 4156', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1414' },
    { nombre: 'Nicolás Andrés', apellido: 'Herrera', dni: '51678012', fechaNacimiento: new Date('1977-11-28'), genero: 'M', telefono: '11-5567-8012', celular: '11-6567-8012', email: 'nicolas.herrera@email.com', direccion: 'Av. Scalabrini Ortiz 5167', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1414' },
    { nombre: 'Agustina Belén', apellido: 'Castro', dni: '61789123', fechaNacimiento: new Date('1994-04-02'), genero: 'F', telefono: '11-5678-9123', celular: '11-6678-9123', email: 'agustina.castro@email.com', direccion: 'Av. Forest 6178', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1427' },
    { nombre: 'Gonzalo Martín', apellido: 'Ruiz', dni: '71890234', fechaNacimiento: new Date('1986-07-21'), genero: 'M', telefono: '11-5789-0234', celular: '11-6789-0234', email: 'gonzalo.ruiz@email.com', direccion: 'Av. Warnes 7189', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1427' },
    { nombre: 'Antonella Giselle', apellido: 'Jiménez', dni: '81901345', fechaNacimiento: new Date('1992-12-11'), genero: 'F', telefono: '11-5890-1345', celular: '11-6890-1345', email: 'antonella.jimenez@email.com', direccion: 'Av. Triunvirato 8190', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1431' },
    { nombre: 'Maximiliano David', apellido: 'Mendoza', dni: '91012456', fechaNacimiento: new Date('1983-03-04'), genero: 'M', telefono: '11-5901-2456', celular: '11-6901-2456', email: 'maximiliano.mendoza@email.com', direccion: 'Av. Elcano 9101', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1427' },
    { nombre: 'Luciana Paola', apellido: 'Ortega', dni: '02345678', fechaNacimiento: new Date('1990-08-17'), genero: 'F', telefono: '11-5023-4567', celular: '11-6023-4567', email: 'luciana.ortega@email.com', direccion: 'Av. Nazca 0234', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1419' },
    // Agregar más pacientes con diferentes edades y provincias
    { nombre: 'Eduardo Raúl', apellido: 'Blanco', dni: '13579246', fechaNacimiento: new Date('1965-05-15'), genero: 'M', telefono: '351-123-4567', celular: '351-612-3456', email: 'eduardo.blanco@email.com', direccion: 'San Martín 1357', ciudad: 'Córdoba', provincia: 'Córdoba', codigoPostal: '5000' },
    { nombre: 'Patricia Mónica', apellido: 'Romero', dni: '24681357', fechaNacimiento: new Date('1972-09-08'), genero: 'F', telefono: '261-234-5678', celular: '261-623-4567', email: 'patricia.romero@email.com', direccion: 'Las Heras 2468', ciudad: 'Mendoza', provincia: 'Mendoza', codigoPostal: '5500' },
    { nombre: 'Sebastián Facundo', apellido: 'Navarro', dni: '35791468', fechaNacimiento: new Date('1998-01-12'), genero: 'M', telefono: '11-5357-9146', celular: '11-6357-9146', email: 'sebastian.navarro@email.com', direccion: 'Av. Libertador 3579', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1636' },
    { nombre: 'Micaela Constanza', apellido: 'Guerrero', dni: '46802579', fechaNacimiento: new Date('2001-06-30'), genero: 'F', telefono: '11-5468-0257', celular: '11-6468-0257', email: 'micaela.guerrero@email.com', direccion: 'Av. Maipú 4680', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1636' },
    { nombre: 'Tomás Gabriel', apellido: 'Aguilar', dni: '57913680', fechaNacimiento: new Date('1979-11-23'), genero: 'M', telefono: '11-5791-3680', celular: '11-6791-3680', email: 'tomas.aguilar@email.com', direccion: 'Av. del Libertador 5791', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1428' },
    { nombre: 'Martina Lourdes', apellido: 'Vargas', dni: '68024791', fechaNacimiento: new Date('1987-04-06'), genero: 'F', telefono: '11-5802-4791', celular: '11-6802-4791', email: 'martina.vargas@email.com', direccion: 'Av. Monroe 6802', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1428' },
    { nombre: 'Joaquín Bautista', apellido: 'Peña', dni: '79135802', fechaNacimiento: new Date('1995-10-14'), genero: 'M', telefono: '11-5913-5802', celular: '11-6913-5802', email: 'joaquin.pena@email.com', direccion: 'Av. Rivadavia 7913', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1406' },
    { nombre: 'Jazmín Aldana', apellido: 'Medina', dni: '80246913', fechaNacimiento: new Date('1993-07-27'), genero: 'F', telefono: '11-5024-6913', celular: '11-6024-6913', email: 'jazmin.medina@email.com', direccion: 'Av. Acoyte 8024', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1406' },
    { nombre: 'Benjamín Emilio', apellido: 'Ramos', dni: '91357024', fechaNacimiento: new Date('2000-02-19'), genero: 'M', telefono: '11-5135-7024', celular: '11-6135-7024', email: 'benjamin.ramos@email.com', direccion: 'Av. Directorio 9135', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1406' },
    { nombre: 'Renata Abril', apellido: 'Ibarra', dni: '03468135', fechaNacimiento: new Date('1988-12-02'), genero: 'F', telefono: '11-5346-8135', celular: '11-6346-8135', email: 'renata.ibarra@email.com', direccion: 'Av. San Juan 0346', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1147' },
    // Más pacientes para llegar a 50+
    { nombre: 'Ignacio Damián', apellido: 'Molina', dni: '14579246', fechaNacimiento: new Date('1981-03-16'), genero: 'M', telefono: '11-5457-9246', celular: '11-6457-9246', email: 'ignacio.molina@email.com', direccion: 'Av. Boedo 1457', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1206' },
    { nombre: 'Julieta Rocío', apellido: 'Campos', dni: '25680357', fechaNacimiento: new Date('1997-08-09'), genero: 'F', telefono: '11-5568-0357', celular: '11-6568-0357', email: 'julieta.campos@email.com', direccion: 'Av. Entre Ríos 2568', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1133' },
    { nombre: 'Santiago Leonel', apellido: 'Villalba', dni: '36791468', fechaNacimiento: new Date('1974-01-24'), genero: 'M', telefono: '11-5679-1468', celular: '11-6679-1468', email: 'santiago.villalba@email.com', direccion: 'Av. Caseros 3679', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1181' },
    { nombre: 'Valentina Sol', apellido: 'Acosta', dni: '47802579', fechaNacimiento: new Date('1999-11-07'), genero: 'F', telefono: '11-5780-2579', celular: '11-6780-2579', email: 'valentina.acosta@email.com', direccion: 'Av. Pavón 4780', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1248' },
    { nombre: 'Bruno Nicolás', apellido: 'Maldonado', dni: '58913680', fechaNacimiento: new Date('1986-06-13'), genero: 'M', telefono: '11-5891-3680', celular: '11-6891-3680', email: 'bruno.maldonado@email.com', direccion: 'Av. Vélez Sarsfield 5891', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1285' },
    { nombre: 'Delfina Maite', apellido: 'Cardozo', dni: '69024791', fechaNacimiento: new Date('2002-04-28'), genero: 'F', telefono: '11-5902-4791', celular: '11-6902-4791', email: 'delfina.cardozo@email.com', direccion: 'Av. La Plata 6902', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1437' },
    { nombre: 'Lautaro Axel', apellido: 'Coronel', dni: '70135802', fechaNacimiento: new Date('1980-09-05'), genero: 'M', telefono: '11-5013-5802', celular: '11-6013-5802', email: 'lautaro.coronel@email.com', direccion: 'Av. Gaona 7013', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1416' },
    { nombre: 'Amparo Celeste', apellido: 'Duarte', dni: '81246913', fechaNacimiento: new Date('1991-12-18'), genero: 'F', telefono: '11-5124-6913', celular: '11-6124-6913', email: 'amparo.duarte@email.com', direccion: 'Av. Segurola 8124', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1440' },
    { nombre: 'Thiago Mateo', apellido: 'Escobar', dni: '92357024', fechaNacimiento: new Date('2003-07-11'), genero: 'M', telefono: '11-5235-7024', celular: '11-6235-7024', email: 'thiago.escobar@email.com', direccion: 'Av. Eva Perón 9235', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1757' },
    { nombre: 'Pilar Esperanza', apellido: 'Figueroa', dni: '04568135', fechaNacimiento: new Date('1985-02-26'), genero: 'F', telefono: '11-5456-8135', celular: '11-6456-8135', email: 'pilar.figueroa@email.com', direccion: 'Av. Roque Pérez 0456', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1408' },
    { nombre: 'Emiliano Cristian', apellido: 'Giménez', dni: '15679246', fechaNacimiento: new Date('1976-05-03'), genero: 'M', telefono: '11-5567-9246', celular: '11-6567-9246', email: 'emiliano.gimenez@email.com', direccion: 'Av. Larrazábal 1567', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1440' },
    { nombre: 'Abril Antonela', apellido: 'Herrera', dni: '26780357', fechaNacimiento: new Date('1994-10-21'), genero: 'F', telefono: '11-5678-0357', celular: '11-6678-0357', email: 'abril.herrera@email.com', direccion: 'Av. Alberdi 2678', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1406' },
    { nombre: 'Bautista Ezequiel', apellido: 'Iglesias', dni: '37891468', fechaNacimiento: new Date('1989-08-14'), genero: 'M', telefono: '11-5789-1468', celular: '11-6789-1468', email: 'bautista.iglesias@email.com', direccion: 'Av. Olivera 3789', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1804' },
    { nombre: 'Milagros Jazmín', apellido: 'Juárez', dni: '48902579', fechaNacimiento: new Date('2001-01-29'), genero: 'F', telefono: '11-5890-2579', celular: '11-6890-2579', email: 'milagros.juarez@email.com', direccion: 'Av. Riccheri 4890', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1439' },
    { nombre: 'Facundo Gastón', apellido: 'León', dni: '59013680', fechaNacimiento: new Date('1978-06-06'), genero: 'M', telefono: '11-5901-3680', celular: '11-6901-3680', email: 'facundo.leon@email.com', direccion: 'Av. Mosconi 5901', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1437' },
    { nombre: 'Zoe Isabella', apellido: 'Maldonado', dni: '60124791', fechaNacimiento: new Date('2000-11-12'), genero: 'F', telefono: '11-5012-4791', celular: '11-6012-4791', email: 'zoe.maldonado@email.com', direccion: 'Av. General Paz 6012', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1437' }
  ]

  const pacientesCreados = []
  for (const pacienteData of pacientesData) {
    const paciente = await prisma.patient.upsert({
      where: { dni: pacienteData.dni },
      update: { ...pacienteData, createdBy: mesa?.id ?? '' },
      create: { ...pacienteData, createdBy: mesa?.id ?? '' }
    })
    pacientesCreados.push(paciente)
  }

  // Crear turnos extensos y realistas
  console.log('📅 Creando turnos (7 días atrás y 14 días adelante, excluyendo HOY)...')
  
  const now = new Date()
  function addMinutes(date: Date, min: number) {
    return new Date(date.getTime() + min * 60000)
  }
  
  function addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
  }

  // Obtener obras sociales creadas
  const obrasSocialesCreadas = await prisma.obraSocial.findMany()
  const osdeObraSocial = obrasSocialesCreadas.find(os => os.nombre === 'OSDE')
  const swissObraSocial = obrasSocialesCreadas.find(os => os.nombre === 'Swiss Medical')
  const particularObraSocial = obrasSocialesCreadas.find(os => os.nombre === 'Particular')

  // Crear turnos distribuidos: 7 días hacia atrás y 14 días hacia adelante
  const turnosData = []
  
  // Para cada día: 7 días atrás hasta 14 días adelante (21 días total)
  for (let dia = -7; dia < 14; dia++) {
    const fechaBase = addDays(now, dia)
    
    // Solo crear turnos en días laborales (lunes a viernes)
    if (fechaBase.getDay() >= 1 && fechaBase.getDay() <= 5) {
      
      // Para cada profesional, crear varios turnos en el día
      for (let profIndex = 0; profIndex < profesionalesCreados.length; profIndex++) {
        const profesional = profesionalesCreados[profIndex]
        
        // Crear entre 6-10 turnos por profesional por día
        const turnosPorDia = 6 + Math.floor(Math.random() * 5)
        
        for (let turno = 0; turno < turnosPorDia; turno++) {
          // Horario de inicio aleatorio entre 8:00 y 16:30
          const horaInicio = 8 + Math.floor(Math.random() * 9) // 8 a 16
          const minutoInicio = Math.random() < 0.5 ? 0 : 30 // :00 o :30
          
          const fechaTurno = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate(), horaInicio, minutoInicio)
          
          const hoyMedianoche = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const mañanaMedianoche = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          
          // Excluir turnos de hoy completamente, solo crear turnos pasados o futuros
          if (fechaTurno < hoyMedianoche || fechaTurno >= mañanaMedianoche) {
            
            // Seleccionar paciente aleatorio
            const pacienteAleatorio = pacientesCreados[Math.floor(Math.random() * pacientesCreados.length)]
            
            // Seleccionar estado según probabilidades realistas
            let estado: AppointmentStatus = AppointmentStatus.PROGRAMADO
            const random = Math.random()
            
            // Si es anterior a hoy, solo estados finalizados
            if (fechaTurno < hoyMedianoche) {
              if (random < 0.7) estado = AppointmentStatus.COMPLETADO
              else if (random < 0.9) estado = AppointmentStatus.CANCELADO
              else estado = AppointmentStatus.NO_ASISTIO
            }
            // Si es futuro (después de hoy), mayoría programados y confirmados
            else if (fechaTurno >= mañanaMedianoche) {
              if (random < 0.8) estado = AppointmentStatus.PROGRAMADO
              else estado = AppointmentStatus.CONFIRMADO
            }
            
            // Seleccionar obra social y tipo de consulta
            let obraSocialId = null
            let numeroAfiliado = null
            let tipoConsulta: TipoConsulta = TipoConsulta.OBRA_SOCIAL
            let copago = null
            
            const tipoConsultaRandom = Math.random()
            if (tipoConsultaRandom < 0.8) {
              // 80% obra social
              const obrasSocialesArray = [osdeObraSocial, swissObraSocial, obrasSocialesCreadas[2], obrasSocialesCreadas[3]]
              const obraSocialSeleccionada = obrasSocialesArray[Math.floor(Math.random() * obrasSocialesArray.length)]
              obraSocialId = obraSocialSeleccionada?.id
              numeroAfiliado = Math.floor(Math.random() * 9000000) + 1000000 + '' // Número de 7 dígitos
              copago = Math.random() < 0.3 ? Math.floor(Math.random() * 5000) + 1000 : null // 30% tienen copago
            } else {
              // 20% particular
              tipoConsulta = TipoConsulta.PARTICULAR
              obraSocialId = particularObraSocial?.id
              copago = Math.floor(Math.random() * 15000) + 5000 // Precio particular entre 5000-20000
            }
            
            // Motivos de consulta realistas
            const motivos = [
              'Control de rutina', 'Dolor de cabeza', 'Consulta por dolor', 'Chequeo anual',
              'Control post-operatorio', 'Seguimiento de tratamiento', 'Consulta preventiva',
              'Dolor abdominal', 'Consulta por fiebre', 'Control de presión arterial',
              'Revisión de estudios', 'Control diabetes', 'Consulta dermatológica',
              'Control cardiológico', 'Consulta por mareos', 'Control ginecológico',
              'Seguimiento neurológico', 'Control oftalmológico', 'Consulta traumatológica',
              'Control pediátrico', 'Consulta por ansiedad', 'Control endocrinológico'
            ]
            const motivoAleatorio = motivos[Math.floor(Math.random() * motivos.length)]
            
            turnosData.push({
              fecha: fechaTurno,
              duracion: 30,
              motivo: motivoAleatorio,
              observaciones: estado === AppointmentStatus.CANCELADO ? 'Turno cancelado por el paciente' :
                           estado === AppointmentStatus.NO_ASISTIO ? 'Paciente no se presentó' :
                           estado === AppointmentStatus.COMPLETADO ? 'Consulta finalizada exitosamente' : null,
              estado,
              obraSocialId,
              numeroAfiliado,
              tipoConsulta,
              copago,
              pacienteId: pacienteAleatorio.id,
              profesionalId: profesional.id,
              createdBy: mesa?.id ?? ''
            })
          }
        }
      }
    }
  }

  // Crear todos los turnos
  console.log(`📊 Creando ${turnosData.length} turnos...`)
  await prisma.appointment.createMany({
    data: turnosData,
    skipDuplicates: true
  })

  // Crear obras sociales argentinas más comunes (mantener las existentes)
  console.log('🏥 Creando obras sociales...')
  const obrasSociales = [
    { nombre: 'OSDE', codigo: 'OSDE' },
    { nombre: 'Swiss Medical', codigo: 'SWISS' },
    { nombre: 'Galeno', codigo: 'GALENO' },
    { nombre: 'IOMA', codigo: 'IOMA' },
    { nombre: 'PAMI', codigo: 'PAMI' },
    { nombre: 'UOM', codigo: 'UOM' },
    { nombre: 'OSECAC', codigo: 'OSECAC' },
    { nombre: 'DOSAC', codigo: 'DOSAC' },
    { nombre: 'MEDICUS', codigo: 'MEDICUS' },
    { nombre: 'IPS', codigo: 'IPS' },
    { nombre: 'OSMATA', codigo: 'OSMATA' },
    { nombre: 'OSPRERA', codigo: 'OSPRERA' },
    { nombre: 'OSPLAD', codigo: 'OSPLAD' },
    { nombre: 'OSTUFF', codigo: 'OSTUFF' },
    { nombre: 'OSUTHGRA', codigo: 'OSUTHGRA' },
    { nombre: 'Particular', codigo: 'PARTICULAR' }
  ]

  for (const obra of obrasSociales) {
    await prisma.obraSocial.upsert({
      where: { codigo: obra.codigo },
      update: {},
      create: obra
    })
  }

  // Estadísticas finales
  const totalUsuarios = await prisma.user.count()
  const totalPacientes = await prisma.patient.count()
  const totalTurnos = await prisma.appointment.count()
  const totalEspecialidades = await prisma.especialidad.count()
  const totalObrasSociales = await prisma.obraSocial.count()

  console.log('\n� ¡Seed completado exitosamente!')
  console.log('📊 Estadísticas de la base de datos:')
  console.log(`   👥 Usuarios: ${totalUsuarios} (${totalUsuarios - 2} profesionales + 2 administrativos)`)
  console.log(`   🏥 Pacientes: ${totalPacientes}`)
  console.log(`   📅 Turnos: ${totalTurnos}`)
  console.log(`   🩺 Especialidades: ${totalEspecialidades}`)
  console.log(`   🏢 Obras Sociales: ${totalObrasSociales}`)
  console.log('\n✅ Base de datos lista para presentación con datos extensos y realistas')

}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })