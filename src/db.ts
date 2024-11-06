const mongoose = require('mongoose');

const dbConnect = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 50000,  // 50 seconds
      socketTimeoutMS: 45000, 
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: unknown) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default dbConnect;
