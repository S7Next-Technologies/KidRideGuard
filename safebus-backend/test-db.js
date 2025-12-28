const oracledb = require('oracledb');

async function testConnection() {
  try {
    oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_21_3' });
    
    const connection = await oracledb.getConnection({
      user: 'schooladmin',
      password: 'your_password',
      connectString: 'localhost:1521/ORCL'
    });
    
    console.log('✅ Database connected successfully!');
    
    const result = await connection.execute('SELECT * FROM Users');
    console.log('Users found:', result.rows.length);
    
    await connection.close();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testConnection();