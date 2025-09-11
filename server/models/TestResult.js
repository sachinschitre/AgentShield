const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  executionId: {
    type: String,
    required: true,
    unique: true
  },
  testSuiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSuite',
    required: true
  },
  executedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'failed', 'cancelled'],
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in milliseconds
  },
  summary: {
    total: {
      type: Number,
      default: 0
    },
    passed: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    skipped: {
      type: Number,
      default: 0
    },
    vulnerabilities: [{
      testId: String,
      testName: String,
      category: String,
      type: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      description: String,
      payload: String
    }]
  },
  tests: [{
    id: String,
    name: String,
    category: String,
    status: {
      type: String,
      enum: ['passed', 'failed', 'skipped']
    },
    startTime: Date,
    endTime: Date,
    duration: Number,
    results: mongoose.Schema.Types.Mixed,
    vulnerability: {
      detected: Boolean,
      type: String,
      severity: String,
      description: String,
      payload: String
    },
    error: String
  }],
  error: {
    type: String
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    environment: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
testResultSchema.index({ executionId: 1 });
testResultSchema.index({ testSuiteId: 1 });
testResultSchema.index({ executedBy: 1 });
testResultSchema.index({ status: 1 });
testResultSchema.index({ startTime: -1 });
testResultSchema.index({ 'summary.vulnerabilities.severity': 1 });

// Virtual for success rate
testResultSchema.virtual('successRate').get(function() {
  if (this.summary.total === 0) return 0;
  return (this.summary.passed / this.summary.total) * 100;
});

// Virtual for vulnerability count by severity
testResultSchema.virtual('vulnerabilityCount').get(function() {
  const counts = { low: 0, medium: 0, high: 0, critical: 0 };
  this.summary.vulnerabilities.forEach(vuln => {
    counts[vuln.severity] = (counts[vuln.severity] || 0) + 1;
  });
  return counts;
});

module.exports = mongoose.model('TestResult', testResultSchema);
