import { PrismaClient, Role, AppointmentStatus, DayOfWeek, TipoConsulta, ProfessionalSchedule } from '@prisma/client'
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

  // Crear obras sociales antes de generar turnos para garantizar referencias válidas
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

  const obrasSocialesCreadas = []
  for (const obra of obrasSociales) {
    const obraSocial = await prisma.obraSocial.upsert({
      where: { codigo: obra.codigo },
      update: obra,
      create: obra
    })
    obrasSocialesCreadas.push(obraSocial)
  }

  // Crear usuarios profesionales más extensos (reducido a la mitad)
  console.log('👨‍⚕️ Creando profesionales...')
  const profesionales = [
    { email: 'ana.cardiologa@carelink.com', name: 'Ana María', apellido: 'González', dni: '12345678', telefono: '11-4123-4567', especialidad: 'Cardiología' },
    { email: 'luis.dermatologo@carelink.com', name: 'Luis Eduardo', apellido: 'Martínez', dni: '23456789', telefono: '11-4234-5678', especialidad: 'Dermatología' },
    { email: 'maria.pediatra@carelink.com', name: 'María José', apellido: 'Rodríguez', dni: '34567890', telefono: '11-4345-6789', especialidad: 'Pediatría' },
    { email: 'carlos.traumatologo@carelink.com', name: 'Carlos Alberto', apellido: 'López', dni: '45678901', telefono: '11-4456-7890', especialidad: 'Traumatología' },
    { email: 'sofia.ginecologa@carelink.com', name: 'Sofía Elena', apellido: 'Fernández', dni: '56789012', telefono: '11-4567-8901', especialidad: 'Ginecología' },
    { email: 'juan.medico.general@carelink.com', name: 'Juan Pablo', apellido: 'Morales', dni: '01234567', telefono: '11-4012-3456', especialidad: 'Medicina General' }
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
        passwordHash: u.passwordHash,
        especialidadId: especialidad?.id
      },
    })
    
    // Crear o actualizar roles
    await prisma.userRole.upsert({
      where: {
        userId_role: {
          userId: usuario.id,
          role: u.role
        }
      },
      update: {},
      create: {
        userId: usuario.id,
        role: u.role
      }
    })
    
    usuariosCreados.push(usuario)
  }

  // Crear horarios para profesionales
  console.log('🕐 Creando horarios profesionales...')
  const profesionalesCreados = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: 'PROFESIONAL'
        }
      }
    }
  })
  
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

  const horariosProfesionalesActivos = await prisma.professionalSchedule.findMany({
    where: {
      userId: {
        in: profesionalesCreados.map(prof => prof.id)
      },
      isActive: true
    }
  })

  const horariosPorProfesional = horariosProfesionalesActivos.reduce<Record<string, Partial<Record<DayOfWeek, ProfessionalSchedule>>>>((acc, horario) => {
    const horarios = acc[horario.userId] ?? {}
    horarios[horario.dayOfWeek] = horario
    acc[horario.userId] = horarios
    return acc
  }, {})

  // Obtener usuario mesa de entrada
  const mesa = await prisma.user.findFirst({
    where: {
      roles: {
        some: {
          role: 'MESA_ENTRADA'
        }
      }
    }
  })

  // Crear pacientes extensos con datos argentinos realistas
  console.log('🏥 Creando pacientes...')
  const pacientesData = [
    { nombre: 'Juan Carlos', apellido: 'Pérez', dni: '12345678', fechaNacimiento: new Date('1990-01-15'), genero: 'Masculino', telefono: '11-5123-4567', celular: '11-6123-4567', email: 'juan.perez@email.com', direccion: 'Av. Corrientes 1234', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1043' },
    { nombre: 'María Eugenia', apellido: 'Gómez', dni: '23456789', fechaNacimiento: new Date('1985-03-22'), genero: 'Femenino', telefono: '11-5234-5678', celular: '11-6234-5678', email: 'maria.gomez@email.com', direccion: 'Av. Santa Fe 2345', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1123' },
    { nombre: 'Roberto Daniel', apellido: 'Martínez', dni: '34567890', fechaNacimiento: new Date('1978-07-10'), genero: 'Masculino', telefono: '11-5345-6789', celular: '11-6345-6789', email: 'roberto.martinez@email.com', direccion: 'Av. Rivadavia 3456', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1203' },
    { nombre: 'Ana Carolina', apellido: 'López', dni: '45678901', fechaNacimiento: new Date('1992-11-05'), genero: 'Femenino', telefono: '11-5456-7890', celular: '11-6456-7890', email: 'ana.lopez@email.com', direccion: 'Av. Callao 4567', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1022' },
    { nombre: 'Carlos Alberto', apellido: 'Rodríguez', dni: '56789012', fechaNacimiento: new Date('1982-09-18'), genero: 'Masculino', telefono: '11-5567-8901', celular: '11-6567-8901', email: 'carlos.rodriguez@email.com', direccion: 'Av. 9 de Julio 5678', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1047' },
    { nombre: 'Sofía Valentina', apellido: 'González', dni: '67890123', fechaNacimiento: new Date('1995-04-12'), genero: 'Femenino', telefono: '11-5678-9012', celular: '11-6678-9012', email: 'sofia.gonzalez@email.com', direccion: 'Av. Las Heras 6789', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1425' },
    { nombre: 'Diego Sebastián', apellido: 'Fernández', dni: '78901234', fechaNacimiento: new Date('1988-12-30'), genero: 'Masculino', telefono: '11-5789-0123', celular: '11-6789-0123', email: 'diego.fernandez@email.com', direccion: 'Av. Córdoba 7890', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1054' },
    { nombre: 'Laura Beatriz', apellido: 'García', dni: '89012345', fechaNacimiento: new Date('1975-06-08'), genero: 'Femenino', telefono: '11-5890-1234', celular: '11-6890-1234', email: 'laura.garcia@email.com', direccion: 'Av. Belgrano 8901', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1092' },
    { nombre: 'Alejandro Miguel', apellido: 'Sánchez', dni: '90123456', fechaNacimiento: new Date('1993-08-25'), genero: 'Masculino', telefono: '11-5901-2345', celular: '11-6901-2345', email: 'alejandro.sanchez@email.com', direccion: 'Av. Pueyrredón 9012', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1118' },
    { nombre: 'Valeria Andrea', apellido: 'Díaz', dni: '01234567', fechaNacimiento: new Date('1987-02-14'), genero: 'Femenino', telefono: '11-5012-3456', celular: '11-6012-3456', email: 'valeria.diaz@email.com', direccion: 'Av. Independencia 0123', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1225' },
    { nombre: 'Matías Esteban', apellido: 'Torres', dni: '11234568', fechaNacimiento: new Date('1991-10-03'), genero: 'Masculino', telefono: '11-5123-4568', celular: '11-6123-4568', email: 'matias.torres@email.com', direccion: 'Av. San Martín 1123', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1004' },
    { nombre: 'Florencia Micaela', apellido: 'Morales', dni: '21345679', fechaNacimiento: new Date('1996-05-20'), genero: 'Femenino', telefono: '11-5234-5679', celular: '11-6234-5679', email: 'florencia.morales@email.com', direccion: 'Av. Cabildo 2134', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1426' },
    { nombre: 'Federico Ignacio', apellido: 'Vega', dni: '31456790', fechaNacimiento: new Date('1984-01-07'), genero: 'Masculino', telefono: '11-5345-6790', celular: '11-6345-6790', email: 'federico.vega@email.com', direccion: 'Av. Medrano 3145', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1179' },
    { nombre: 'Camila Soledad', apellido: 'Silva', dni: '41567901', fechaNacimiento: new Date('1989-09-16'), genero: 'Femenino', telefono: '11-5456-7901', celular: '11-6456-7901', email: 'camila.silva@email.com', direccion: 'Av. Juan B. Justo 4156', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1414' },
    { nombre: 'Nicolás Andrés', apellido: 'Herrera', dni: '51678012', fechaNacimiento: new Date('1977-11-28'), genero: 'Masculino', telefono: '11-5567-8012', celular: '11-6567-8012', email: 'nicolas.herrera@email.com', direccion: 'Av. Scalabrini Ortiz 5167', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1414' },
    { nombre: 'Agustina Belén', apellido: 'Castro', dni: '61789123', fechaNacimiento: new Date('1994-04-02'), genero: 'Femenino', telefono: '11-5678-9123', celular: '11-6678-9123', email: 'agustina.castro@email.com', direccion: 'Av. Forest 6178', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1427' },
    { nombre: 'Gonzalo Martín', apellido: 'Ruiz', dni: '71890234', fechaNacimiento: new Date('1986-07-21'), genero: 'Masculino', telefono: '11-5789-0234', celular: '11-6789-0234', email: 'gonzalo.ruiz@email.com', direccion: 'Av. Warnes 7189', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1427' },
    { nombre: 'Antonella Giselle', apellido: 'Jiménez', dni: '81901345', fechaNacimiento: new Date('1992-12-11'), genero: 'Femenino', telefono: '11-5890-1345', celular: '11-6890-1345', email: 'antonella.jimenez@email.com', direccion: 'Av. Triunvirato 8190', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1431' },
    { nombre: 'Maximiliano David', apellido: 'Mendoza', dni: '91012456', fechaNacimiento: new Date('1983-03-04'), genero: 'Masculino', telefono: '11-5901-2456', celular: '11-6901-2456', email: 'maximiliano.mendoza@email.com', direccion: 'Av. Elcano 9101', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1427' },
    { nombre: 'Luciana Paola', apellido: 'Ortega', dni: '02345678', fechaNacimiento: new Date('1990-08-17'), genero: 'Femenino', telefono: '11-5023-4567', celular: '11-6023-4567', email: 'luciana.ortega@email.com', direccion: 'Av. Nazca 0234', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1419' },
    // Agregar más pacientes con diferentes edades y provincias
    { nombre: 'Eduardo Raúl', apellido: 'Blanco', dni: '13579246', fechaNacimiento: new Date('1965-05-15'), genero: 'Masculino', telefono: '351-123-4567', celular: '351-612-3456', email: 'eduardo.blanco@email.com', direccion: 'San Martín 1357', ciudad: 'Córdoba', provincia: 'Córdoba', codigoPostal: '5000' },
    { nombre: 'Patricia Mónica', apellido: 'Romero', dni: '24681357', fechaNacimiento: new Date('1972-09-08'), genero: 'Femenino', telefono: '261-234-5678', celular: '261-623-4567', email: 'patricia.romero@email.com', direccion: 'Las Heras 2468', ciudad: 'Mendoza', provincia: 'Mendoza', codigoPostal: '5500' },
    { nombre: 'Sebastián Facundo', apellido: 'Navarro', dni: '35791468', fechaNacimiento: new Date('1998-01-12'), genero: 'Masculino', telefono: '11-5357-9146', celular: '11-6357-9146', email: 'sebastian.navarro@email.com', direccion: 'Av. Libertador 3579', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1636' },
    { nombre: 'Micaela Constanza', apellido: 'Guerrero', dni: '46802579', fechaNacimiento: new Date('2001-06-30'), genero: 'Femenino', telefono: '11-5468-0257', celular: '11-6468-0257', email: 'micaela.guerrero@email.com', direccion: 'Av. Maipú 4680', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1636' },
    { nombre: 'Tomás Gabriel', apellido: 'Aguilar', dni: '57913680', fechaNacimiento: new Date('1979-11-23'), genero: 'Masculino', telefono: '11-5791-3680', celular: '11-6791-3680', email: 'tomas.aguilar@email.com', direccion: 'Av. del Libertador 5791', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1428' },
    { nombre: 'Martina Lourdes', apellido: 'Vargas', dni: '68024791', fechaNacimiento: new Date('1987-04-06'), genero: 'Femenino', telefono: '11-5802-4791', celular: '11-6802-4791', email: 'martina.vargas@email.com', direccion: 'Av. Monroe 6802', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1428' },
    { nombre: 'Joaquín Bautista', apellido: 'Peña', dni: '79135802', fechaNacimiento: new Date('1995-10-14'), genero: 'Masculino', telefono: '11-5913-5802', celular: '11-6913-5802', email: 'joaquin.pena@email.com', direccion: 'Av. Rivadavia 7913', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1406' },
    { nombre: 'Jazmín Aldana', apellido: 'Medina', dni: '80246913', fechaNacimiento: new Date('1993-07-27'), genero: 'Femenino', telefono: '11-5024-6913', celular: '11-6024-6913', email: 'jazmin.medina@email.com', direccion: 'Av. Acoyte 8024', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1406' },
    { nombre: 'Benjamín Emilio', apellido: 'Ramos', dni: '91357024', fechaNacimiento: new Date('2000-02-19'), genero: 'Masculino', telefono: '11-5135-7024', celular: '11-6135-7024', email: 'benjamin.ramos@email.com', direccion: 'Av. Directorio 9135', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1406' },
    { nombre: 'Renata Abril', apellido: 'Ibarra', dni: '03468135', fechaNacimiento: new Date('1988-12-02'), genero: 'Femenino', telefono: '11-5346-8135', celular: '11-6346-8135', email: 'renata.ibarra@email.com', direccion: 'Av. San Juan 0346', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1147' },
    // Más pacientes para llegar a 50+
    { nombre: 'Ignacio Damián', apellido: 'Molina', dni: '14579246', fechaNacimiento: new Date('1981-03-16'), genero: 'Masculino', telefono: '11-5457-9246', celular: '11-6457-9246', email: 'ignacio.molina@email.com', direccion: 'Av. Boedo 1457', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1206' },
    { nombre: 'Julieta Rocío', apellido: 'Campos', dni: '25680357', fechaNacimiento: new Date('1997-08-09'), genero: 'Femenino', telefono: '11-5568-0357', celular: '11-6568-0357', email: 'julieta.campos@email.com', direccion: 'Av. Entre Ríos 2568', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1133' },
    { nombre: 'Santiago Leonel', apellido: 'Villalba', dni: '36791468', fechaNacimiento: new Date('1974-01-24'), genero: 'Masculino', telefono: '11-5679-1468', celular: '11-6679-1468', email: 'santiago.villalba@email.com', direccion: 'Av. Caseros 3679', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1181' },
    { nombre: 'Valentina Sol', apellido: 'Acosta', dni: '47802579', fechaNacimiento: new Date('1999-11-07'), genero: 'Femenino', telefono: '11-5780-2579', celular: '11-6780-2579', email: 'valentina.acosta@email.com', direccion: 'Av. Pavón 4780', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1248' },
    { nombre: 'Bruno Nicolás', apellido: 'Maldonado', dni: '58913680', fechaNacimiento: new Date('1986-06-13'), genero: 'Masculino', telefono: '11-5891-3680', celular: '11-6891-3680', email: 'bruno.maldonado@email.com', direccion: 'Av. Vélez Sarsfield 5891', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1285' },
    { nombre: 'Delfina Maite', apellido: 'Cardozo', dni: '69024791', fechaNacimiento: new Date('2002-04-28'), genero: 'Femenino', telefono: '11-5902-4791', celular: '11-6902-4791', email: 'delfina.cardozo@email.com', direccion: 'Av. La Plata 6902', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1437' },
    { nombre: 'Lautaro Axel', apellido: 'Coronel', dni: '70135802', fechaNacimiento: new Date('1980-09-05'), genero: 'Masculino', telefono: '11-5013-5802', celular: '11-6013-5802', email: 'lautaro.coronel@email.com', direccion: 'Av. Gaona 7013', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1416' },
    { nombre: 'Amparo Celeste', apellido: 'Duarte', dni: '81246913', fechaNacimiento: new Date('1991-12-18'), genero: 'Femenino', telefono: '11-5124-6913', celular: '11-6124-6913', email: 'amparo.duarte@email.com', direccion: 'Av. Segurola 8124', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1440' },
    { nombre: 'Thiago Mateo', apellido: 'Escobar', dni: '92357024', fechaNacimiento: new Date('2003-07-11'), genero: 'Masculino', telefono: '11-5235-7024', celular: '11-6235-7024', email: 'thiago.escobar@email.com', direccion: 'Av. Eva Perón 9235', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1757' },
    { nombre: 'Pilar Esperanza', apellido: 'Figueroa', dni: '04568135', fechaNacimiento: new Date('1985-02-26'), genero: 'Femenino', telefono: '11-5456-8135', celular: '11-6456-8135', email: 'pilar.figueroa@email.com', direccion: 'Av. Roque Pérez 0456', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1408' },
    { nombre: 'Emiliano Cristian', apellido: 'Giménez', dni: '15679246', fechaNacimiento: new Date('1976-05-03'), genero: 'Masculino', telefono: '11-5567-9246', celular: '11-6567-9246', email: 'emiliano.gimenez@email.com', direccion: 'Av. Larrazábal 1567', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1440' },
    { nombre: 'Abril Antonela', apellido: 'Herrera', dni: '26780357', fechaNacimiento: new Date('1994-10-21'), genero: 'Femenino', telefono: '11-5678-0357', celular: '11-6678-0357', email: 'abril.herrera@email.com', direccion: 'Av. Alberdi 2678', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1406' },
    { nombre: 'Bautista Ezequiel', apellido: 'Iglesias', dni: '37891468', fechaNacimiento: new Date('1989-08-14'), genero: 'Masculino', telefono: '11-5789-1468', celular: '11-6789-1468', email: 'bautista.iglesias@email.com', direccion: 'Av. Olivera 3789', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1804' },
    { nombre: 'Milagros Jazmín', apellido: 'Juárez', dni: '48902579', fechaNacimiento: new Date('2001-01-29'), genero: 'Femenino', telefono: '11-5890-2579', celular: '11-6890-2579', email: 'milagros.juarez@email.com', direccion: 'Av. Riccheri 4890', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1439' },
    { nombre: 'Facundo Gastón', apellido: 'León', dni: '59013680', fechaNacimiento: new Date('1978-06-06'), genero: 'Masculino', telefono: '11-5901-3680', celular: '11-6901-3680', email: 'facundo.leon@email.com', direccion: 'Av. Mosconi 5901', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1437' },
    { nombre: 'Zoe Isabella', apellido: 'Maldonado', dni: '60124791', fechaNacimiento: new Date('2000-11-12'), genero: 'Femenino', telefono: '11-5012-4791', celular: '11-6012-4791', email: 'zoe.maldonado@email.com', direccion: 'Av. General Paz 6012', ciudad: 'Buenos Aires', provincia: 'Buenos Aires', codigoPostal: '1437' }
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

  // Crear turnos extensos y realistas cumpliendo las nuevas reglas de fechas/estados
  console.log('📅 Creando turnos históricos y futuros (sin los próximos 7 días)...')

  const now = new Date()
  const inicioDeHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  function addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
  }

  const dayOfWeekMap: DayOfWeek[] = [
    DayOfWeek.DOMINGO,
    DayOfWeek.LUNES,
    DayOfWeek.MARTES,
    DayOfWeek.MIERCOLES,
    DayOfWeek.JUEVES,
    DayOfWeek.VIERNES,
    DayOfWeek.SABADO
  ]

  const duracionMinima = 30
  const intervaloMinutos = 30 // Turnos solo pueden empezar en punto o media hora

  function getDayOfWeekEnum(date: Date): DayOfWeek {
    return dayOfWeekMap[date.getDay()]
  }

  function timeStringToMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  function haySolapamiento(intervalos: Array<{ start: number; end: number }>, inicio: number, fin: number) {
    return intervalos.some(intervalo => Math.max(intervalo.start, inicio) < Math.min(intervalo.end, fin))
  }

  function shuffle<T>(items: T[]) {
    const clone = [...items]
    for (let i = clone.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[clone[i], clone[j]] = [clone[j], clone[i]]
    }
    return clone
  }

  function seleccionarIntervaloDisponible(
    inicio: number,
    finDia: number,
    intervalosOcupados: Array<{ start: number; end: number }>
  ): { duracion: number; fin: number } | null {
    // Solo turnos de 30 minutos que empiecen en punto o media hora
    const duracion = 30
    
    // Buscar slots disponibles cada 30 minutos (en punto y media hora)
    for (let horario = inicio; horario + duracion <= finDia; horario += 30) {
      // Verificar que el horario esté en punto o media hora
      const minutos = horario % 60
      if (minutos !== 0 && minutos !== 30) continue
      
      const fin = horario + duracion
      if (!haySolapamiento(intervalosOcupados, horario, fin)) {
        return { duracion, fin }
      }
    }
    return null
  }

  const particularObraSocial = obrasSocialesCreadas.find(os => os.nombre === 'Particular')

  const pastDays = 30
  const futureDays = 60

  const dayOffsets: number[] = []
  // Turnos pasados
  for (let offset = 1; offset <= pastDays; offset++) {
    dayOffsets.push(-offset)
  }
  // Turnos futuros (incluyendo esta semana)
  for (let offset = 1; offset <= futureDays; offset++) {
    dayOffsets.push(offset)
  }

  const motivos = [
    'Control de rutina', 'Dolor de cabeza', 'Consulta por dolor', 'Chequeo anual',
    'Control post-operatorio', 'Seguimiento de tratamiento', 'Consulta preventiva',
    'Dolor abdominal', 'Consulta por fiebre', 'Control de presión arterial',
    'Revisión de estudios', 'Control diabetes', 'Consulta dermatológica',
    'Control cardiológico', 'Consulta por mareos', 'Control ginecológico',
    'Seguimiento neurológico', 'Control oftalmológico', 'Consulta traumatológica',
    'Control pediátrico', 'Consulta por ansiedad', 'Control endocrinológico',
    'Consulta por alergias', 'Control pre quirúrgico', 'Revisión de medicación crónica',
    'Consulta por insomnio', 'Evaluación nutricional', 'Consulta por dolor lumbar',
    'Seguimiento de embarazo', 'Control de estudios de laboratorio', 'Consulta de segunda opinión',
    'Control de tratamiento psiquiátrico', 'Consulta por fatiga crónica'
  ]

  const observacionesPorEstado: Partial<Record<AppointmentStatus, string[]>> = {
    [AppointmentStatus.PROGRAMADO]: [
      'Recordar ayuno de 8 horas',
      'Paciente solicita recordatorio por WhatsApp',
      'Traer estudios previos impresos',
      'Mesa de entrada coordina entrega de resultados'
    ],
    [AppointmentStatus.CONFIRMADO]: [
      'Paciente confirmó asistencia vía telefónica',
      'Se verificó cobertura de obra social',
      'Paciente llegará 10 minutos antes',
      'Confirmado por correo electrónico'
    ],
    [AppointmentStatus.COMPLETADO]: [
      'Consulta finalizada exitosamente',
      'Se indicó seguimiento en 30 días',
      'Paciente derivado para estudios complementarios'
    ],
    [AppointmentStatus.CANCELADO]: [
      'Turno cancelado por el paciente',
      'Turno cancelado por reprogramación del profesional',
      'Cancelación por inconvenientes de transporte'
    ],
    [AppointmentStatus.NO_ASISTIO]: [
      'Paciente no se presentó',
      'Paciente avisó luego del horario de la consulta'
    ]
  }

  const creadorTurnos = mesa?.id ?? usuariosCreados[0]?.id ?? ''
  const turnosData = []

  for (const offset of dayOffsets) {
    const fechaBase = addDays(now, offset)

    // Solo crear turnos en días laborales (lunes a viernes)
    if (fechaBase.getDay() === 0 || fechaBase.getDay() === 6) {
      continue
    }

    const dayOfWeek = getDayOfWeekEnum(fechaBase)

    for (const profesional of profesionalesCreados) {
      const horariosProfesional = horariosPorProfesional[profesional.id]
      const horarioDelDia = horariosProfesional?.[dayOfWeek]

      if (!horarioDelDia) {
        continue
      }

      let inicioJornada = timeStringToMinutes(horarioDelDia.startTime)
      const finJornada = timeStringToMinutes(horarioDelDia.endTime)

      // Para esta semana (offset >= 0 y <= 7), los turnos deben ser después de las 16:00
      if (offset >= 0 && offset <= 7) {
        const minimoHorario = 16 * 60 // 16:00 en minutos
        inicioJornada = Math.max(inicioJornada, minimoHorario)
      }

      if (finJornada - inicioJornada < duracionMinima) {
        continue
      }

      const posiblesInicios: number[] = []
      for (let minuto = inicioJornada; minuto <= finJornada - duracionMinima; minuto += intervaloMinutos) {
        posiblesInicios.push(minuto)
      }

      if (!posiblesInicios.length) {
        continue
      }

      const turnosPorDia = Math.min(5 + Math.floor(Math.random() * 6), posiblesInicios.length)
      const intervalosOcupados: Array<{ start: number; end: number }> = []
      const candidatos = shuffle(posiblesInicios)

      let turnosAsignados = 0

      for (const inicioMinuto of candidatos) {
        if (turnosAsignados >= turnosPorDia) {
          break
        }

        const intervaloDisponible = seleccionarIntervaloDisponible(inicioMinuto, finJornada, intervalosOcupados)
        if (!intervaloDisponible) {
          continue
        }

        const fechaTurno = new Date(
          fechaBase.getFullYear(),
          fechaBase.getMonth(),
          fechaBase.getDate(),
          Math.floor(inicioMinuto / 60),
          inicioMinuto % 60
        )

        const pacienteAleatorio = pacientesCreados[Math.floor(Math.random() * pacientesCreados.length)]

        // Determinar estado respetando reglas de consistencia
        let estado: AppointmentStatus
        const randomEstado = Math.random()

        if (fechaTurno < inicioDeHoy) {
          // Turnos pasados solo pueden estar COMPLETADO, CANCELADO o NO_ASISTIO
          if (randomEstado < 0.7) estado = AppointmentStatus.COMPLETADO
          else if (randomEstado < 0.9) estado = AppointmentStatus.CANCELADO
          else estado = AppointmentStatus.NO_ASISTIO
        } else {
          // Turnos futuros NO pueden estar COMPLETADO
          if (randomEstado < 0.4) estado = AppointmentStatus.PROGRAMADO
          else if (randomEstado < 0.7) estado = AppointmentStatus.CONFIRMADO
          else if (randomEstado < 0.85) estado = AppointmentStatus.EN_SALA_DE_ESPERA
          else estado = AppointmentStatus.CANCELADO
        }

        // Seleccionar obra social y tipo de consulta
        let obraSocialId: string | null = null
        let numeroAfiliado: string | null = null
        let tipoConsulta: TipoConsulta = TipoConsulta.OBRA_SOCIAL
        let copago: number | null = null

        const tipoConsultaRandom = Math.random()
        const obrasSocialesNoParticular = obrasSocialesCreadas.filter(os => os.nombre !== 'Particular')

        if (tipoConsultaRandom < 0.75 && obrasSocialesCreadas.length > 0) {
          const obrasParaElegir = obrasSocialesNoParticular.length ? obrasSocialesNoParticular : obrasSocialesCreadas
          const obraSocialSeleccionada = obrasParaElegir[Math.floor(Math.random() * obrasParaElegir.length)]
          obraSocialId = obraSocialSeleccionada.id
          numeroAfiliado = String(Math.floor(Math.random() * 9000000) + 1000000)
          copago = Math.random() < 0.35 ? Math.floor(Math.random() * 5000) + 1000 : null
        } else {
          tipoConsulta = TipoConsulta.PARTICULAR
          obraSocialId = particularObraSocial?.id ?? null
          copago = Math.floor(Math.random() * 15000) + 5000
        }

        const motivoAleatorio = motivos[Math.floor(Math.random() * motivos.length)]
        const observacionesLista = observacionesPorEstado[estado]
        const observaciones = observacionesLista
          ? observacionesLista[Math.floor(Math.random() * observacionesLista.length)]
          : null

        turnosData.push({
          fecha: fechaTurno,
          duracion: intervaloDisponible.duracion,
          motivo: motivoAleatorio,
          observaciones,
          estado,
          obraSocialId,
          numeroAfiliado,
          tipoConsulta,
          copago,
          pacienteId: pacienteAleatorio.id,
          profesionalId: profesional.id,
          createdBy: creadorTurnos
        })

        intervalosOcupados.push({ start: inicioMinuto, end: intervaloDisponible.fin })
        turnosAsignados += 1
      }
    }
  }

  // Crear todos los turnos
  console.log(`📊 Creando ${turnosData.length} turnos...`)
  await prisma.appointment.createMany({
    data: turnosData,
    skipDuplicates: true
  })

  console.log('🧾 Generando cancelaciones y datos clínicos asociados...')

  const motivosCancelacion = [
    'El paciente no podía asistir',
    'Se reprogramó por indicación médica',
    'Conflicto con otra consulta',
    'Solicitado por el profesional',
    'Paciente informó mejoría de síntomas',
    'Problemas de cobertura de obra social'
  ]

  const turnosCancelados = await prisma.appointment.findMany({
    where: { estado: AppointmentStatus.CANCELADO },
    select: {
      id: true,
      fecha: true,
      pacienteId: true,
      profesionalId: true,
      createdBy: true
    }
  })

  for (const turno of turnosCancelados) {
    const motivo = motivosCancelacion[Math.floor(Math.random() * motivosCancelacion.length)]
    const horasAntes = Math.floor(Math.random() * 72) + 6 // entre 6 y 78 horas antes
    const cancelledAtCandidate = new Date(turno.fecha.getTime() - horasAntes * 60 * 60 * 1000)
    const cancelledAt = cancelledAtCandidate > now ? now : cancelledAtCandidate
    const cancelledById = mesa?.id ?? turno.createdBy ?? turno.profesionalId

    await prisma.appointmentCancellation.upsert({
      where: { id: turno.id },
      update: {
        motivo,
        cancelledById,
        cancelledAt
      },
      create: {
        appointmentId: turno.id,
        pacienteId: turno.pacienteId,
        cancelledById,
        motivo,
        cancelledAt
      }
    })
  }

  type ConsultaTemplate = {
    principal: string
    secundarios?: string[]
    notas?: string
    prescription?: {
      notas?: string
      items: Array<{
        medicamento: string
        dosis: string
        frecuencia: string
        duracion: string
        indicaciones?: string
      }>
    }
    estudios?: Array<{
      estudio: string
      indicaciones?: string
    }>
    medicaciones?: Array<{
      nombre: string
      dosis?: string
      frecuencia?: string
      viaAdministracion?: string
      indicaciones?: string
      duracionDias?: number
    }>
  }

  const templatesGenerales: ConsultaTemplate[] = [
    {
      principal: 'Chequeo clínico general',
      secundarios: ['Necesita control de laboratorio anual'],
      notas: 'Control de salud preventivo, se solicita laboratorio completo y seguimiento en 12 meses.',
      prescription: {
        notas: 'Recomendar actividad física moderada 3 veces por semana.',
        items: [
          {
            medicamento: 'Suplemento vitamínico',
            dosis: '1 comprimido',
            frecuencia: '1 vez al día',
            duracion: '60 días',
            indicaciones: 'Tomar durante el desayuno'
          }
        ]
      },
      estudios: [
        { estudio: 'Laboratorio clínico completo', indicaciones: 'Ayuno de 12 horas' },
        { estudio: 'Electrocardiograma en reposo', indicaciones: 'Sin preparación especial' }
      ],
      medicaciones: [
        {
          nombre: 'Complejo vitamínico B',
          dosis: '1 comprimido',
          frecuencia: 'Una vez al día',
          viaAdministracion: 'Oral',
          indicaciones: 'Tomar con alimentos',
          duracionDias: 60
        }
      ]
    },
    {
      principal: 'Seguimiento de diabetes tipo 2',
      secundarios: ['Control glucémico subóptimo'],
      notas: 'Ajuste de medicación hipoglucemiante y énfasis en plan alimentario.',
      prescription: {
        notas: 'Se ajusta dosis de hipoglucemiantes orales.',
        items: [
          {
            medicamento: 'Metformina 850 mg',
            dosis: '850 mg',
            frecuencia: '2 veces al día',
            duracion: '90 días',
            indicaciones: 'Tomar después de las comidas'
          }
        ]
      },
      estudios: [
        { estudio: 'Hemoglobina glicosilada (HbA1c)', indicaciones: 'Ayuno de 8 horas' },
        { estudio: 'Función renal', indicaciones: 'Ayuno de 8 horas' }
      ],
      medicaciones: [
        {
          nombre: 'Metformina',
          dosis: '850 mg',
          frecuencia: 'Dos veces al día',
          viaAdministracion: 'Oral',
          indicaciones: 'Tomar con alimentos',
          duracionDias: 180
        }
      ]
    }
  ]

  const consultaTemplates: Record<string, ConsultaTemplate[]> = {
    General: templatesGenerales,
    'Medicina General': templatesGenerales,
    'Cardiología': [
      {
        principal: 'Hipertensión arterial esencial',
        secundarios: ['Dislipidemia mixta'],
        notas: 'Se refuerzan hábitos saludables y se controla tensión en 30 días.',
        prescription: {
          notas: 'Mantener registro diario de presión arterial.',
          items: [
            {
              medicamento: 'Losartán 50 mg',
              dosis: '50 mg',
              frecuencia: '1 vez al día',
              duracion: '30 días',
              indicaciones: 'Tomar a la mañana'
            },
            {
              medicamento: 'Atorvastatina 20 mg',
              dosis: '20 mg',
              frecuencia: '1 vez por la noche',
              duracion: '30 días',
              indicaciones: 'Ingerir con un vaso de agua'
            }
          ]
        },
        estudios: [
          { estudio: 'Perfil lipídico', indicaciones: 'Ayuno de 12 horas' },
          { estudio: 'Holter de presión arterial', indicaciones: 'Control durante 24 horas' }
        ],
        medicaciones: [
          {
            nombre: 'Losartán',
            dosis: '50 mg',
            frecuencia: 'Una vez al día',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar por la mañana',
            duracionDias: 180
          },
          {
            nombre: 'Atorvastatina',
            dosis: '20 mg',
            frecuencia: 'Una vez al día',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar antes de dormir',
            duracionDias: 150
          }
        ]
      },
      {
        principal: 'Insuficiencia cardíaca leve',
        secundarios: ['Hipertensión controlada'],
        notas: 'Monitorizar signos de descompensación y controlar peso a diario.',
        prescription: {
          notas: 'Reforzar dieta hiposódica y uso correcto de medicación.',
          items: [
            {
              medicamento: 'Enalapril 10 mg',
              dosis: '10 mg',
              frecuencia: '2 veces al día',
              duracion: '45 días',
              indicaciones: 'Tomar mañana y noche'
            },
            {
              medicamento: 'Furosemida 40 mg',
              dosis: '40 mg',
              frecuencia: '1 vez al día',
              duracion: '30 días',
              indicaciones: 'Tomar por la mañana'
            }
          ]
        },
        estudios: [
          { estudio: 'Ecocardiograma Doppler', indicaciones: 'Sin preparación' },
          { estudio: 'Ionograma completo', indicaciones: 'Ayuno de 8 horas' }
        ],
        medicaciones: [
          {
            nombre: 'Enalapril',
            dosis: '10 mg',
            frecuencia: 'Dos veces al día',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar cada 12 horas',
            duracionDias: 120
          }
        ]
      }
    ],
    'Dermatología': [
      {
        principal: 'Dermatitis atópica crónica',
        secundarios: ['Prurito nocturno'],
        notas: 'Se ajusta esquema de hidratación y corticoide tópico en lesiones.',
        prescription: {
          notas: 'Aplicar emolientes luego del baño.',
          items: [
            {
              medicamento: 'Crema con hidrocortisona 1%',
              dosis: 'Aplicación fina',
              frecuencia: '2 veces al día',
              duracion: '14 días',
              indicaciones: 'Aplicar sobre lesiones activas'
            }
          ]
        },
        estudios: [
          { estudio: 'IgE sérica', indicaciones: 'Ayuno de 8 horas' }
        ],
        medicaciones: [
          {
            nombre: 'Antihistamínico no sedante',
            dosis: '1 comprimido',
            frecuencia: 'Una vez al día',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar por la mañana',
            duracionDias: 30
          }
        ]
      },
      {
        principal: 'Psoriasis en placas',
        secundarios: ['Compromiso leve de codos y rodillas'],
        notas: 'Se indicó continuidad de tratamiento tópico y control fototerapia.',
        prescription: {
          items: [
            {
              medicamento: 'Ungüento con calcipotriol/betametasona',
              dosis: 'Aplicación localizada',
              frecuencia: '1 vez al día',
              duracion: '30 días',
              indicaciones: 'Aplicar a la noche'
            }
          ]
        },
        estudios: [
          { estudio: 'Perfil hepático', indicaciones: 'Ayuno de 8 horas' }
        ],
        medicaciones: [
          {
            nombre: 'Calcipotriol tópico',
            frecuencia: 'Una vez al día',
            viaAdministracion: 'Tópica',
            indicaciones: 'Aplicar en lesiones',
            duracionDias: 60
          }
        ]
      }
    ],
    'Pediatría': [
      {
        principal: 'Bronquiolitis leve en resolución',
        secundarios: ['Antecedente de prematuridad'],
        notas: 'Continuar control respiratorio y kinesiología si persisten secreciones.',
        prescription: {
          notas: 'Hidratación y control de temperatura.',
          items: [
            {
              medicamento: 'Salbutamol inhalado 100 mcg',
              dosis: '2 puff',
              frecuencia: 'Cada 6 horas según necesidad',
              duracion: '10 días',
              indicaciones: 'Usar con aerocámara'
            }
          ]
        },
        estudios: [
          { estudio: 'Radiografía de tórax', indicaciones: 'Frontal y lateral' }
        ],
        medicaciones: [
          {
            nombre: 'Salbutamol inhalador',
            frecuencia: 'Según necesidad',
            viaAdministracion: 'Inhalatoria',
            indicaciones: 'Utilizar con aerocámara',
            duracionDias: 14
          }
        ]
      },
      {
        principal: 'Faringitis viral',
        secundarios: ['Control febril adecuado'],
        notas: 'Seguimiento telefónico a las 48 horas.',
        prescription: {
          items: [
            {
              medicamento: 'Paracetamol pediátrico 160 mg/5 ml',
              dosis: '10 mg/kg',
              frecuencia: 'Cada 6 horas si hay fiebre',
              duracion: '5 días',
              indicaciones: 'Suspender si no hay fiebre'
            }
          ]
        },
        medicaciones: [
          {
            nombre: 'Paracetamol jarabe',
            dosis: '10 mg/kg',
            frecuencia: 'Según necesidad',
            viaAdministracion: 'Oral',
            indicaciones: 'Administrar con jeringa dosificadora',
            duracionDias: 5
          }
        ]
      }
    ],
    'Traumatología': [
      {
        principal: 'Esguince de tobillo grado II',
        secundarios: ['Edema en resolución'],
        notas: 'Continuar rehabilitación y vendaje funcional por 10 días.',
        prescription: {
          items: [
            {
              medicamento: 'Ibuprofeno 600 mg',
              dosis: '600 mg',
              frecuencia: 'Cada 8 horas',
              duracion: '7 días',
              indicaciones: 'Tomar con alimentos'
            }
          ]
        },
        estudios: [
          { estudio: 'Resonancia magnética de tobillo', indicaciones: 'Sin contraste' }
        ],
        medicaciones: [
          {
            nombre: 'Ibuprofeno',
            dosis: '600 mg',
            frecuencia: 'Cada 8 horas',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar con comida',
            duracionDias: 7
          }
        ]
      },
      {
        principal: 'Lumbalgia mecánica',
        secundarios: ['Contractura paravertebral'],
        notas: 'Se recomienda fisioterapia y fortalecimiento muscular.',
        prescription: {
          items: [
            {
              medicamento: 'Diclofenac 75 mg',
              dosis: '75 mg',
              frecuencia: 'Cada 12 horas',
              duracion: '5 días',
              indicaciones: 'Tomar después de las comidas'
            }
          ]
        },
        estudios: [
          { estudio: 'Radiografía de columna lumbar', indicaciones: 'Frente y perfil' }
        ],
        medicaciones: [
          {
            nombre: 'Diclofenac',
            dosis: '75 mg',
            frecuencia: 'Dos veces al día',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar luego de comer',
            duracionDias: 10
          }
        ]
      }
    ],
    'Ginecología': [
      {
        principal: 'Control prenatal de segundo trimestre',
        secundarios: ['Embarazo sin complicaciones'],
        notas: 'Seguimiento mensual y educación prenatal.',
        prescription: {
          items: [
            {
              medicamento: 'Sulfato ferroso 200 mg',
              dosis: '200 mg',
              frecuencia: '1 vez al día',
              duracion: '90 días',
              indicaciones: 'Tomar con jugo cítrico'
            }
          ]
        },
        estudios: [
          { estudio: 'Ecografía obstétrica morfológica', indicaciones: 'Semana 20-22' },
          { estudio: 'Laboratorio prenatal completo', indicaciones: 'Ayuno de 8 horas' }
        ],
        medicaciones: [
          {
            nombre: 'Hierro polimaltosado',
            dosis: '1 comprimido',
            frecuencia: 'Una vez al día',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar con jugo',
            duracionDias: 90
          }
        ]
      },
      {
        principal: 'Síndrome de ovario poliquístico',
        secundarios: ['Consulta por irregularidad menstrual'],
        notas: 'Plan de control metabólico y evaluación endocrinológica.',
        prescription: {
          items: [
            {
              medicamento: 'Metformina 500 mg',
              dosis: '500 mg',
              frecuencia: '2 veces al día',
              duracion: '60 días',
              indicaciones: 'Tomar con las comidas'
            }
          ]
        },
        estudios: [
          { estudio: 'Perfil hormonal femenino', indicaciones: 'Ayuno de 8 horas' }
        ],
        medicaciones: [
          {
            nombre: 'Metformina',
            dosis: '500 mg',
            frecuencia: 'Dos veces al día',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar con comida',
            duracionDias: 120
          }
        ]
      }
    ],
    'Neurología': [
      {
        principal: 'Migraña sin aura',
        secundarios: ['Episodios semanales'],
        notas: 'Plan de profilaxis y seguimiento en 8 semanas.',
        prescription: {
          items: [
            {
              medicamento: 'Propranolol 40 mg',
              dosis: '40 mg',
              frecuencia: '2 veces al día',
              duracion: '30 días',
              indicaciones: 'No suspender bruscamente'
            },
            {
              medicamento: 'Sumatriptán 50 mg',
              dosis: '50 mg',
              frecuencia: 'Al inicio de la crisis',
              duracion: 'Según necesidad',
              indicaciones: 'No repetir antes de 2 horas'
            }
          ]
        },
        estudios: [
          { estudio: 'Resonancia magnética cerebral', indicaciones: 'Sin contraste' }
        ],
        medicaciones: [
          {
            nombre: 'Propranolol',
            dosis: '40 mg',
            frecuencia: 'Dos veces al día',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar cada 12 horas',
            duracionDias: 90
          }
        ]
      },
      {
        principal: 'Neuropatía periférica leve',
        secundarios: ['Parestesias nocturnas'],
        notas: 'Se refuerza control metabólico y suplementación vitamínica.',
        prescription: {
          items: [
            {
              medicamento: 'Gabapentina 300 mg',
              dosis: '300 mg',
              frecuencia: '1 vez a la noche',
              duracion: '30 días',
              indicaciones: 'Evaluar somnolencia'
            }
          ]
        },
        estudios: [
          { estudio: 'Electromiografía', indicaciones: 'Descanso previo' }
        ],
        medicaciones: [
          {
            nombre: 'Gabapentina',
            dosis: '300 mg',
            frecuencia: 'Una vez al día',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar por la noche',
            duracionDias: 60
          }
        ]
      }
    ],
    'Oftalmología': [
      {
        principal: 'Astigmatismo miópico bilateral',
        secundarios: ['Fatiga visual en pantallas'],
        notas: 'Se actualiza fórmula de lentes y se sugieren descansos visuales.',
        prescription: {
          notas: 'Se indica fórmula óptica actualizada.',
          items: [
            {
              medicamento: 'Lágrimas artificiales sin conservantes',
              dosis: '2 gotas',
              frecuencia: '4 veces al día',
              duracion: '30 días',
              indicaciones: 'Aplicar en ambos ojos'
            }
          ]
        },
        estudios: [
          { estudio: 'Topografía corneal', indicaciones: 'Sin lentes de contacto 24 h previas' }
        ],
        medicaciones: [
          {
            nombre: 'Lágrimas artificiales',
            frecuencia: 'Cuatro veces al día',
            viaAdministracion: 'Oftálmica',
            indicaciones: 'Aplicar en ambos ojos',
            duracionDias: 30
          }
        ]
      },
      {
        principal: 'Conjuntivitis alérgica',
        secundarios: ['Eritema leve'],
        notas: 'Control en 7 días para evaluar respuesta.',
        prescription: {
          items: [
            {
              medicamento: 'Antihistamínico ocular',
              dosis: '1 gota',
              frecuencia: '2 veces al día',
              duracion: '14 días',
              indicaciones: 'No usar lentes de contacto durante el tratamiento'
            }
          ]
        },
        medicaciones: [
          {
            nombre: 'Antihistamínico oftálmico',
            frecuencia: 'Dos veces al día',
            viaAdministracion: 'Oftálmica',
            indicaciones: 'Evitar lentes de contacto',
            duracionDias: 14
          }
        ]
      }
    ],
    'Otorrinolaringología': [
      {
        principal: 'Sinusitis aguda',
        secundarios: ['Cefalea frontal'],
        notas: 'Se indica tratamiento antibiótico y control en 10 días.',
        prescription: {
          items: [
            {
              medicamento: 'Amoxicilina/Ácido clavulánico 875/125 mg',
              dosis: '1 comprimido',
              frecuencia: 'Cada 12 horas',
              duracion: '10 días',
              indicaciones: 'Tomar después de las comidas'
            }
          ]
        },
        estudios: [
          { estudio: 'Tomografía de senos paranasales', indicaciones: 'Sin contraste' }
        ],
        medicaciones: [
          {
            nombre: 'Amoxicilina con ácido clavulánico',
            frecuencia: 'Cada 12 horas',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar con comida',
            duracionDias: 10
          }
        ]
      },
      {
        principal: 'Otitis media serosa',
        secundarios: ['Hipoacusia leve'],
        notas: 'Control audiológico y medidas descongestivas.',
        prescription: {
          items: [
            {
              medicamento: 'Descongestivo nasal tópico',
              dosis: '2 pulverizaciones',
              frecuencia: '3 veces al día',
              duracion: '5 días',
              indicaciones: 'No usar más de 5 días'
            }
          ]
        },
        estudios: [
          { estudio: 'Audiometría tonal', indicaciones: 'Sin exposición a ruidos intensos 24 h previas' }
        ]
      }
    ],
    'Psiquiatría': [
      {
        principal: 'Trastorno de ansiedad generalizada',
        secundarios: ['Insomnio inicial'],
        notas: 'Se coordina psicoterapia y control medicación en 4 semanas.',
        prescription: {
          items: [
            {
              medicamento: 'Sertralina 50 mg',
              dosis: '50 mg',
              frecuencia: '1 vez al día',
              duracion: '30 días',
              indicaciones: 'Tomar por la mañana'
            }
          ]
        },
        medicaciones: [
          {
            nombre: 'Sertralina',
            dosis: '50 mg',
            frecuencia: 'Una vez al día',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar a la mañana',
            duracionDias: 90
          }
        ]
      },
      {
        principal: 'Episodio depresivo leve',
        secundarios: ['Anhedonia'],
        notas: 'Plan de seguimiento semanal y coordinación con terapeuta.',
        prescription: {
          items: [
            {
              medicamento: 'Escitalopram 10 mg',
              dosis: '10 mg',
              frecuencia: '1 vez al día',
              duracion: '30 días',
              indicaciones: 'Tomar por la noche'
            }
          ]
        },
        medicaciones: [
          {
            nombre: 'Escitalopram',
            dosis: '10 mg',
            frecuencia: 'Una vez al día',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar por la noche',
            duracionDias: 120
          }
        ]
      }
    ],
    'Gastroenterología': [
      {
        principal: 'Gastritis crónica',
        secundarios: ['Helicobacter pylori pendiente de control'],
        notas: 'Se refuerza dieta y adherencia al tratamiento erradicador.',
        prescription: {
          items: [
            {
              medicamento: 'Omeprazol 20 mg',
              dosis: '20 mg',
              frecuencia: '2 veces al día',
              duracion: '30 días',
              indicaciones: 'Tomar 30 minutos antes de las comidas'
            }
          ]
        },
        estudios: [
          { estudio: 'Endoscopía digestiva alta', indicaciones: 'Ayuno de 8 horas' }
        ],
        medicaciones: [
          {
            nombre: 'Omeprazol',
            dosis: '20 mg',
            frecuencia: 'Dos veces al día',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar antes de comer',
            duracionDias: 60
          }
        ]
      },
      {
        principal: 'Síndrome de intestino irritable',
        secundarios: ['Predominio diarreico'],
        notas: 'Plan alimentario y seguimiento en 6 semanas.',
        prescription: {
          items: [
            {
              medicamento: 'Butilescopolamina 10 mg',
              dosis: '10 mg',
              frecuencia: 'Cada 8 horas',
              duracion: '15 días',
              indicaciones: 'Tomar ante dolor abdominal'
            }
          ]
        },
        medicaciones: [
          {
            nombre: 'Butilescopolamina',
            dosis: '10 mg',
            frecuencia: 'Según necesidad',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar ante dolor',
            duracionDias: 30
          }
        ]
      }
    ],
    'Endocrinología': [
      {
        principal: 'Hipotiroidismo clínico',
        secundarios: ['TSH elevada'],
        notas: 'Ajuste de levotiroxina y control en 6 semanas.',
        prescription: {
          items: [
            {
              medicamento: 'Levotiroxina 100 mcg',
              dosis: '100 mcg',
              frecuencia: '1 vez al día',
              duracion: '45 días',
              indicaciones: 'Tomar en ayunas'
            }
          ]
        },
        estudios: [
          { estudio: 'TSH y T4 libre', indicaciones: 'Ayuno de 8 horas' }
        ],
        medicaciones: [
          {
            nombre: 'Levotiroxina',
            dosis: '100 mcg',
            frecuencia: 'Una vez al día',
            viaAdministracion: 'Oral',
            indicaciones: 'Tomar en ayunas',
            duracionDias: 120
          }
        ]
      },
      {
        principal: 'Diabetes tipo 2 descompensada',
        secundarios: ['Glicemia en ayunas elevada'],
        notas: 'Se refuerza educación diabetológica y control nutricional.',
        prescription: {
          items: [
            {
              medicamento: 'Insulina NPH',
              dosis: '10 UI',
              frecuencia: '2 veces al día',
              duracion: '30 días',
              indicaciones: 'Aplicar antes de desayuno y cena'
            }
          ]
        },
        estudios: [
          { estudio: 'Microalbuminuria', indicaciones: 'Muestra de orina de 24 horas' }
        ],
        medicaciones: [
          {
            nombre: 'Insulina NPH',
            dosis: '10 UI',
            frecuencia: 'Dos veces al día',
            viaAdministracion: 'Subcutánea',
            indicaciones: 'Aplicar antes de desayuno y cena',
            duracionDias: 90
          }
        ]
      }
    ]
  }

  const turnosCompletados = await prisma.appointment.findMany({
    where: { estado: AppointmentStatus.COMPLETADO },
    include: {
      paciente: true,
      profesional: {
        include: { especialidad: true }
      },
      diagnoses: true,
      prescriptions: true,
      studyOrders: true
    }
  })

  const medicacionesExistentes = await prisma.patientMedication.findMany({
    select: { patientId: true, nombre: true }
  })

  const medicacionesClave = new Set(medicacionesExistentes.map((m) => `${m.patientId}|${m.nombre}`))

  for (const turno of turnosCompletados) {
    const especialidadNombre = turno.profesional.especialidad?.nombre ?? 'General'
    const plantillas = consultaTemplates[especialidadNombre] ?? consultaTemplates.General
    const plantilla = plantillas[Math.floor(Math.random() * plantillas.length)]

    let diagnosis = turno.diagnoses[0]
    if (!diagnosis) {
      diagnosis = await prisma.diagnosis.create({
        data: {
          appointmentId: turno.id,
          patientId: turno.pacienteId,
          professionalId: turno.profesionalId,
          principal: plantilla.principal,
          secundarios: plantilla.secundarios ?? [],
          notas: plantilla.notas
        }
      })
    }

    if (turno.prescriptions.length === 0 && plantilla.prescription && Math.random() < 0.75) {
      const prescription = await prisma.prescription.create({
        data: {
          appointmentId: turno.id,
          patientId: turno.pacienteId,
          professionalId: turno.profesionalId,
          notas: plantilla.prescription.notas ?? plantilla.notas,
          items: {
            create: plantilla.prescription.items
          }
        }
      })

      await prisma.prescriptionDiagnosis.createMany({
        data: [
          {
            prescriptionId: prescription.id,
            diagnosisId: diagnosis.id
          }
        ],
        skipDuplicates: true
      })
    } else if (turno.prescriptions.length > 0) {
      await prisma.prescriptionDiagnosis.createMany({
        data: turno.prescriptions.map((prescription) => ({
          prescriptionId: prescription.id,
          diagnosisId: diagnosis.id
        })),
        skipDuplicates: true
      })
    }

    if (turno.studyOrders.length === 0 && plantilla.estudios && plantilla.estudios.length > 0 && Math.random() < 0.5) {
      await prisma.studyOrder.create({
        data: {
          appointmentId: turno.id,
          patientId: turno.pacienteId,
          professionalId: turno.profesionalId,
          notas: plantilla.notas,
          items: {
            create: plantilla.estudios
          }
        }
      })
    }

    if (plantilla.medicaciones && plantilla.medicaciones.length > 0 && Math.random() < 0.6) {
      for (const medicacion of plantilla.medicaciones) {
        const clave = `${turno.pacienteId}|${medicacion.nombre}`
        if (medicacionesClave.has(clave)) {
          continue
        }

        const fechaInicio = turno.fecha
        const fechaFin = medicacion.duracionDias ? addDays(fechaInicio, medicacion.duracionDias) : null

        await prisma.patientMedication.create({
          data: {
            patientId: turno.pacienteId,
            professionalId: turno.profesionalId,
            nombre: medicacion.nombre,
            dosis: medicacion.dosis,
            frecuencia: medicacion.frecuencia,
            viaAdministracion: medicacion.viaAdministracion,
            fechaInicio,
            fechaFin,
            indicaciones: medicacion.indicaciones,
            activo: !fechaFin ? true : fechaFin >= now
          }
        })

        medicacionesClave.add(clave)
      }
    }
  }

  // Estadísticas finales
  const totalUsuarios = await prisma.user.count()
  const totalPacientes = await prisma.patient.count()
  const totalTurnos = await prisma.appointment.count()
  const totalEspecialidades = await prisma.especialidad.count()
  const totalObrasSociales = await prisma.obraSocial.count()
  const totalCancelaciones = await prisma.appointmentCancellation.count()
  const totalDiagnosticos = await prisma.diagnosis.count()
  const totalPrescripciones = await prisma.prescription.count()
  const totalEstudios = await prisma.studyOrder.count()
  const totalMedicaciones = await prisma.patientMedication.count()

  console.log('\n🎉 ¡Seed completado exitosamente!')
  console.log('📊 Estadísticas de la base de datos:')
  console.log(`   👥 Usuarios: ${totalUsuarios} (${totalUsuarios - 2} profesionales + 2 administrativos)`)
  console.log(`   🏥 Pacientes: ${totalPacientes}`)
  console.log(`   📅 Turnos: ${totalTurnos}`)
  console.log(`   🩺 Especialidades: ${totalEspecialidades}`)
  console.log(`   🏢 Obras Sociales: ${totalObrasSociales}`)
  console.log(`   ❌ Cancelaciones de turnos: ${totalCancelaciones}`)
  console.log(`   📝 Diagnósticos: ${totalDiagnosticos}`)
  console.log(`   💊 Prescripciones: ${totalPrescripciones}`)
  console.log(`   🧪 Órdenes de estudio: ${totalEstudios}`)
  console.log(`   💼 Medicaciones registradas: ${totalMedicaciones}`)
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
