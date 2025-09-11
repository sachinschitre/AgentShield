const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  }
});

const testCategorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['input_injection', 'api_fuzzing', 'agentic_workflow'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  tests: [testCaseSchema],
  enabled: {
    type: Boolean,
    default: true
  }
});

const testSuiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  categories: [testCategorySchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  settings: {
    timeout: {
      type: Number,
      default: 10000
    },
    parallel: {
      type: Boolean,
      default: false
    },
    retryCount: {
      type: Number,
      default: 0
    }
  },
  lastExecuted: {
    type: Date
  },
  executionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
testSuiteSchema.index({ createdBy: 1, name: 1 });
testSuiteSchema.index({ isPublic: 1 });
testSuiteSchema.index({ tags: 1 });

module.exports = mongoose.model('TestSuite', testSuiteSchema);
