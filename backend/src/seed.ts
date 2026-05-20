import bcrypt from 'bcryptjs';
import { getDb } from './config/db';

async function seedDatabase() {
  console.log('Seeding SQLite database...');
  try {
    const db = await getDb();

    // 1. Clear existing data (optional but good for clean seeding)
    // We disable foreign key constraint check temporarily to clear tables cleanly
    await db.run('PRAGMA foreign_keys = OFF');
    await db.run('DELETE FROM tasks');
    await db.run('DELETE FROM project_members');
    await db.run('DELETE FROM projects');
    await db.run('DELETE FROM users');
    await db.run('PRAGMA foreign_keys = ON');

    console.log('Cleared existing data.');

    // 2. Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 3. Insert Users
    const adminResult = await db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Alex Mercer (Admin)', 'admin@taskflow.com', hashedPassword, 'Admin']
    );
    const adminId = adminResult.lastID;

    const janeResult = await db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Jane Doe', 'jane@taskflow.com', hashedPassword, 'Member']
    );
    const janeId = janeResult.lastID;

    const johnResult = await db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['John Smith', 'john@taskflow.com', hashedPassword, 'Member']
    );
    const johnId = johnResult.lastID;

    const aliceResult = await db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Alice Johnson', 'alice@taskflow.com', hashedPassword, 'Member']
    );
    const aliceId = aliceResult.lastID;

    console.log('Users seeded.');

    // 4. Insert Projects
    const project1Result = await db.run(
      'INSERT INTO projects (name, description, creator_id) VALUES (?, ?, ?)',
      ['Website Redesign', 'Complete redesign of our official landing pages and customer portal using Tailwind CSS.', adminId]
    );
    const project1Id = project1Result.lastID;

    const project2Result = await db.run(
      'INSERT INTO projects (name, description, creator_id) VALUES (?, ?, ?)',
      ['Mobile App Development', 'Building a new iOS and Android mobile client using React Native and Express API.', adminId]
    );
    const project2Id = project2Result.lastID;

    console.log('Projects seeded.');

    // 5. Add Members to Projects
    // Website Redesign: Admin, Jane, John, Alice
    await db.run('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [project1Id, adminId]);
    await db.run('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [project1Id, janeId]);
    await db.run('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [project1Id, johnId]);
    await db.run('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [project1Id, aliceId]);

    // Mobile App Dev: Admin, Jane, Alice
    await db.run('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [project2Id, adminId]);
    await db.run('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [project2Id, janeId]);
    await db.run('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [project2Id, aliceId]);

    console.log('Project memberships seeded.');

    // 6. Insert Tasks
    const today = new Date();
    
    // Future due dates
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().split('T')[0];

    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().split('T')[0];

    // Past due dates (for testing overdue dashboard features)
    const pastDue1 = new Date(today);
    pastDue1.setDate(today.getDate() - 2);
    const pastDue1Str = pastDue1.toISOString().split('T')[0];

    const pastDue2 = new Date(today);
    pastDue2.setDate(today.getDate() - 5);
    const pastDue2Str = pastDue2.toISOString().split('T')[0];

    // Website Redesign Tasks
    await db.run(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, creator_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project1Id, 'Design Figma mockups', 'Draft UI mockups for the landing page and the member dashboard.', 'Completed', 'High', pastDue2Str, janeId, adminId]
    );

    await db.run(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, creator_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project1Id, 'Setup tailwind configuration', 'Install Tailwind CSS and set up basic themes, components, and responsive breaks.', 'In Progress', 'Medium', in3DaysStr, janeId, adminId]
    );

    await db.run(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, creator_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project1Id, 'Build homepage components', 'Build navigation bar, footer, and main hero sections.', 'To Do', 'High', in7DaysStr, johnId, adminId]
    );

    await db.run(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, creator_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project1Id, 'Write authentication API endpoints', 'Implement login, signup, and me routes in Express server.', 'Review', 'High', pastDue1Str, aliceId, adminId] // Overdue (Review status)
    );

    // Mobile App Development Tasks
    await db.run(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, creator_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project2Id, 'Setup push notifications', 'Configure APNs and Firebase Cloud Messaging for app alerts.', 'To Do', 'Medium', in7DaysStr, aliceId, adminId]
    );

    await db.run(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, creator_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project2Id, 'Write API documentation', 'Write down Swagger or postman specs for integration.', 'To Do', 'Low', pastDue2Str, janeId, adminId] // Overdue (To Do status)
    );

    console.log('Tasks seeded successfully.');
    console.log('Database seeding completed. Default users:');
    console.log('1. Admin: admin@taskflow.com (password: password123)');
    console.log('2. Member Jane: jane@taskflow.com (password: password123)');
    console.log('3. Member John: john@taskflow.com (password: password123)');
    console.log('4. Member Alice: alice@taskflow.com (password: password123)');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

seedDatabase();
