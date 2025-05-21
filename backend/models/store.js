import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.js';

const Store = sequelize.define('Store', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  templateId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  storeName: {
    type: DataTypes.STRING,
    allowNull: false
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
});

// Set up the association
Store.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Store, { foreignKey: 'userId' });

export default Store; 