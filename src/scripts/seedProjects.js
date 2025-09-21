import mongoose from 'mongoose';
import Project from '../models/Project.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const seedProjects = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Find existing users (docente y estudiantes)
    const docente = await User.findOne({ role: 'docente' });
    const estudiantes = await User.find({ role: 'estudiante' }).limit(3);

    if (!docente) {
      console.log('❌ No se encontró un docente en la base de datos');
      process.exit(1);
    }

    console.log(`✅ Encontrado docente: ${docente.name}`);
    console.log(`✅ Encontrados ${estudiantes.length} estudiantes`);

    // Clear existing projects
    await Project.deleteMany({});
    console.log('🗑️ Proyectos existentes eliminados');

    // Sample projects data
    const projectsData = [
      {
        title: 'Sistema de Reconocimiento Facial con IA',
        description: 'Desarrollo de un sistema de reconocimiento facial utilizando redes neuronales convolucionales para control de acceso en el campus universitario.',
        shortDescription: 'Sistema de IA para reconocimiento facial y control de acceso',
        technologies: ['Python', 'TensorFlow', 'OpenCV', 'MongoDB', 'React'],
        status: 'en-desarrollo',
        team: [
          { user: docente._id, role: 'Director del Proyecto' },
          ...(estudiantes.length > 0 ? [{ user: estudiantes[0]._id, role: 'Desarrollador Frontend' }] : []),
          ...(estudiantes.length > 1 ? [{ user: estudiantes[1]._id, role: 'Desarrollador Backend' }] : [])
        ],
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-07-15'),
        repositoryUrl: 'https://github.com/semillero-guia/facial-recognition',
        featured: true,
        createdBy: docente._id
      },
      {
        title: 'Chatbot Inteligente para Atención Estudiantil',
        description: 'Bot conversacional con procesamiento de lenguaje natural para resolver dudas académicas y administrativas de los estudiantes.',
        shortDescription: 'Chatbot con NLP para atención estudiantil',
        technologies: ['Python', 'NLTK', 'Flask', 'MongoDB', 'Vue.js'],
        status: 'planificado',
        team: [
          { user: docente._id, role: 'Supervisor' },
          ...(estudiantes.length > 1 ? [{ user: estudiantes[1]._id, role: 'Desarrollador Principal' }] : [])
        ],
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-01'),
        repositoryUrl: 'https://github.com/semillero-guia/chatbot-estudiantil',
        featured: false,
        createdBy: docente._id
      },
      {
        title: 'Análisis Predictivo de Deserción Estudiantil',
        description: 'Modelo de machine learning para predecir el riesgo de deserción académica basado en datos históricos y comportamiento estudiantil.',
        shortDescription: 'ML para predicción de deserción estudiantil',
        technologies: ['Python', 'Scikit-learn', 'Pandas', 'Jupyter', 'PostgreSQL'],
        status: 'completado',
        team: [
          { user: docente._id, role: 'Investigador Principal' },
          ...(estudiantes.length > 2 ? [{ user: estudiantes[2]._id, role: 'Analista de Datos' }] : []),
          ...(estudiantes.length > 0 ? [{ user: estudiantes[0]._id, role: 'Desarrollador' }] : [])
        ],
        startDate: new Date('2023-08-01'),
        endDate: new Date('2023-12-15'),
        repositoryUrl: 'https://github.com/semillero-guia/prediccion-desercion',
        featured: true,
        createdBy: docente._id
      },
      {
        title: 'Plataforma de Gestión de Proyectos Académicos',
        description: 'Sistema web para la gestión y seguimiento de proyectos académicos del semillero, incluyendo asignaciones, entregas y evaluaciones.',
        shortDescription: 'Plataforma de gestión académica',
        technologies: ['Node.js', 'Express', 'MongoDB', 'React', 'Socket.io'],
        status: 'en-desarrollo',
        team: [
          { user: docente._id, role: 'Product Owner' },
          ...(estudiantes.length > 0 ? [{ user: estudiantes[0]._id, role: 'Full Stack Developer' }] : [])
        ],
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-12-01'),
        repositoryUrl: 'https://github.com/semillero-guia/plataforma-gestion',
        featured: false,
        createdBy: docente._id
      }
    ];

    // Create projects
    const createdProjects = await Project.insertMany(projectsData);
    console.log(`✅ ${createdProjects.length} proyectos creados exitosamente`);

    // Display created projects with IDs
    console.log('\n📋 PROYECTOS CREADOS:');
    for (const project of createdProjects) {
      console.log(`🎯 ${project.title}`);
      console.log(`   ID: ${project._id}`);
      console.log(`   Estado: ${project.status}`);
      console.log(`   Equipo: ${project.team.length} miembros`);
      console.log(`   Tecnologías: ${project.technologies.join(', ')}`);
      console.log('   ─────────────────────────────────────────');
    }

    console.log('\n🎉 ¡Seeding completado exitosamente!');
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. Reinicia el servidor (npm run dev)');
    console.log('2. Prueba GET /api/projects para ver los proyectos');
    console.log('3. Usa uno de los IDs de arriba para crear una asignación');
    console.log('4. Prueba POST /api/assignments con un project ID válido');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seeding:', error);
    process.exit(1);
  }
};

// Run seeding
seedProjects();