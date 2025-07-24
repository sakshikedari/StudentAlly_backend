const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, 
    },
  },
});


// Test connection
sequelize
  .authenticate()
  .then(() => console.log("✅ Database connected successfully!"))
  .catch((err) => console.error("❌ Database connection failed:", err));

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true, // Enable createdAt & updatedAt
    tableName: "users", // Ensure the correct table name
  }
);

// Sync models with the database (for development)
sequelize
  .sync({ alter: true }) 
  .then(() => console.log("✅ Database & tables synced!"))
  .catch((err) => console.error("❌ Error syncing database:", err));

module.exports = { sequelize, User };
