import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.js';

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  templateId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  storeName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'uniqueStoreNamePerUser'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  domainName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  region: {
    type: DataTypes.STRING,
    allowNull: false
  },
  province: {
    type: DataTypes.STRING,
    allowNull: false
  },
  municipality: {
    type: DataTypes.STRING,
    allowNull: false
  },
  barangay: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft'
  }
}, {
  tableName: 'Stores',
  timestamps: true
});

// Set up the association
Store.belongsTo(User, { 
  foreignKey: 'userId',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
User.hasMany(Store, { 
  foreignKey: 'userId'
});

export default Store; 