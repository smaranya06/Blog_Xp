/**
 * @fileoverview Database Seeding Script - 200 Comprehensive Test Blogs
 * @description Seeds the MongoDB database with 30 diverse authors and 200 realistic,
 * high-quality blog posts featuring images and videos across tech, design, AI,
 * cloud architecture, security, and developer life.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Blog = require('../models/Blog');

// 30 distinct users with diverse backgrounds and avatar assignments
const USER_PROFILES = [
  { username: 'alex_coder', email: 'alex.coder@example.com', avatar: '/images/avatars/face-1.svg', role: 'user' },
  { username: 'sarah_dev', email: 'sarah.dev@example.com', avatar: '/images/avatars/face-2.svg', role: 'user' },
  { username: 'marcus_tech', email: 'marcus.tech@example.com', avatar: '/images/avatars/face-3.svg', role: 'user' },
  { username: 'elena_ux', email: 'elena.ux@example.com', avatar: '/images/avatars/face-4.svg', role: 'user' },
  { username: 'david_cloud', email: 'david.cloud@example.com', avatar: '/images/avatars/face-5.svg', role: 'user' },
  { username: 'priya_ai', email: 'priya.ai@example.com', avatar: '/images/avatars/face-6.svg', role: 'user' },
  { username: 'liam_frontend', email: 'liam.frontend@example.com', avatar: '/images/avatars/face-7.svg', role: 'user' },
  { username: 'maya_security', email: 'maya.sec@example.com', avatar: '/images/avatars/face-8.svg', role: 'user' },
  { username: 'kenji_fullstack', email: 'kenji.dev@example.com', avatar: '/images/avatars/face-1.svg', role: 'user' },
  { username: 'olivia_data', email: 'olivia.data@example.com', avatar: '/images/avatars/face-2.svg', role: 'user' },
  { username: 'arjun_systems', email: 'arjun.sys@example.com', avatar: '/images/avatars/face-3.svg', role: 'user' },
  { username: 'chloe_designer', email: 'chloe.design@example.com', avatar: '/images/avatars/face-4.svg', role: 'user' },
  { username: 'vikram_ml', email: 'vikram.ml@example.com', avatar: '/images/avatars/face-5.svg', role: 'user' },
  { username: 'sophia_web', email: 'sophia.web@example.com', avatar: '/images/avatars/face-6.svg', role: 'user' },
  { username: 'nathan_devops', email: 'nathan.devops@example.com', avatar: '/images/avatars/face-7.svg', role: 'user' },
  { username: 'zoya_crypto', email: 'zoya.crypto@example.com', avatar: '/images/avatars/face-8.svg', role: 'user' },
  { username: 'felix_backend', email: 'felix.backend@example.com', avatar: '/images/avatars/face-1.svg', role: 'user' },
  { username: 'ananya_mobile', email: 'ananya.mobile@example.com', avatar: '/images/avatars/face-2.svg', role: 'user' },
  { username: 'carlos_network', email: 'carlos.net@example.com', avatar: '/images/avatars/face-3.svg', role: 'user' },
  { username: 'tanya_product', email: 'tanya.product@example.com', avatar: '/images/avatars/face-4.svg', role: 'user' },
  { username: 'jordan_qa', email: 'jordan.qa@example.com', avatar: '/images/avatars/face-5.svg', role: 'user' },
  { username: 'mina_software', email: 'mina.soft@example.com', avatar: '/images/avatars/face-6.svg', role: 'user' },
  { username: 'lucas_rust', email: 'lucas.rust@example.com', avatar: '/images/avatars/face-7.svg', role: 'user' },
  { username: 'aisha_cloud', email: 'aisha.cloud@example.com', avatar: '/images/avatars/face-8.svg', role: 'user' },
  { username: 'sam_engineer', email: 'sam.eng@example.com', avatar: '/images/avatars/face-1.svg', role: 'user' },
  { username: 'emma_architect', email: 'emma.arch@example.com', avatar: '/images/avatars/face-2.svg', role: 'user' },
  { username: 'leo_kernel', email: 'leo.kernel@example.com', avatar: '/images/avatars/face-3.svg', role: 'user' },
  { username: 'hannah_ui', email: 'hannah.ui@example.com', avatar: '/images/avatars/face-4.svg', role: 'user' },
  { username: 'devon_infra', email: 'devon.infra@example.com', avatar: '/images/avatars/face-5.svg', role: 'user' },
  { username: 'rachel_algo', email: 'rachel.algo@example.com', avatar: '/images/avatars/face-6.svg', role: 'user' }
];

// Rich set of local & high-bandwidth CDN sample media
const IMAGE_MEDIA = [
  '/uploads/blogs/sample-coding.jpg',
  '/uploads/blogs/sample-design.jpg',
  '/uploads/blogs/sample-cloud.jpg',
  '/uploads/blogs/sample-cybersecurity.jpg',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
];

const VIDEO_MEDIA = [
  '/uploads/blogs/sample-bunny.mp4',
  '/uploads/blogs/sample-flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4'
];

// Topic templates with deep domain specifics to generate 200 unique articles
const TOPIC_TEMPLATES = [
  {
    category: 'Frontend & JavaScript',
    tags: ['javascript', 'webdev', 'frontend'],
    titles: [
      'Mastering Async/Await and Promise Concurrency in Modern JavaScript',
      'The Evolution of JavaScript: From ES6 to Modern ECMAScript Features',
      'Building Resilient Frontend Applications with Web Workers and Shared Memory',
      'Zero-Runtime CSS in TypeScript: The Future of Component Styling',
      'Demystifying the JavaScript Event Loop, Microtasks, and Macrotasks',
      'Optimizing Web Vitals: Achieving 100/100 Lighthouse Scores in Production',
      'Deep Dive into JavaScript Memory Leaks and Garbage Collection Mechanics',
      'Micro-Frontends in Practice: Module Federation at Scale',
      'How Modern Browser Rendering Engines Turn Code into Pixels',
      'Mastering DOM Virtualization for Infinite Scrolling with Millions of Records',
      'Building Offline-First Web Applications with IndexedDB and Background Sync',
      'State Management Architecture: Signals, Stores, and Reactivity Patterns',
      'Modern JavaScript Tooling: Why the Ecosystem is Moving to Rust and Zig',
      'Securing Client-Side Applications Against Prototype Pollution Attacks',
      'WebAssembly in the Browser: Running Native C++ and Rust in JavaScript',
      'Building Interactive Canvas and WebGL Graphics for Modern Web Apps',
      'Clean Code Principles for Scalable TypeScript Codebases',
      'Effective Error Handling and Crash Reporting in Enterprise Web Apps',
      'Progressive Web Apps (PWAs) in 2026: Capabilities, Service Workers, and Push',
      'Tree Shaking and Code Splitting: Slashing JavaScript Bundle Sizes by 70%'
    ]
  },
  {
    category: 'Backend & Architecture',
    tags: ['backend', 'nodejs', 'architecture'],
    titles: [
      'Designing High-Throughput Event-Driven Architectures with Kafka and Node.js',
      'Microservices vs Modular Monolith: Choosing the Right Path for Growth',
      'Rate Limiting and DDoS Protection Strategies for Distributed Express APIs',
      'Distributed Caching Strategies: Redis Clusters, Cache-Aside, and Write-Through',
      'Building Resilient Microservices with Circuit Breakers and Fallbacks',
      'Zero-Downtime Database Migrations in High-Traffic Production Environments',
      'Idempotency Keys and Safe Retries in Distributed Financial Transactions',
      'Implementing Event Sourcing and CQRS: Lessons from the Real World',
      'Stream Processing with Node.js Pipelines and Backpressure Management',
      'Designing Enterprise GraphQL Gateways with Apollo Federation and Subgraphs',
      'Real-Time WebSocket Architectures for Millions of Concurrent Connections',
      'Graceful Shutdown and Health Probes in Containerized Backend Services',
      'API Versioning Strategies: URI, Header, and Content Negotiation Compared',
      'Building Fault-Tolerant Background Job Processors with Redis and BullMQ',
      'Database Connection Pooling: Tuning Pool Sizes for MongoDB and Postgres',
      'Observability Deep Dive: Distributed Tracing with OpenTelemetry and Jaeger',
      'Implementing Granular Role-Based Access Control (RBAC) in Node.js',
      'High-Performance gRPC Services: Protocol Buffers vs Traditional REST JSON',
      'Securing Secrets and Environment Variables in Cloud Native Architectures',
      'Scalable Logging Strategies: Structured JSON, Vector Ingestion, and ELK'
    ]
  },
  {
    category: 'Cloud & DevOps',
    tags: ['devops', 'cloud', 'kubernetes', 'docker'],
    titles: [
      'Kubernetes Cluster Autoscaling: Production Playbook for High Traffic',
      'Zero-Trust Networking in Cloud Environments: WireGuard, Istio, and mTLS',
      'Building Lightning-Fast CI/CD Pipelines with GitHub Actions and Docker BuildKit',
      'Terraform Best Practices: Structuring Multi-Environment Infrastructure as Code',
      'Container Security Hardening: Multi-Stage Builds, Distroless, and Non-Root Users',
      'Cloud Cost Optimization: Slashing AWS Infrastructure Spend by 45%',
      'Disaster Recovery and Multi-Region Failover Architecture Explained',
      'Serverless vs Containers: Pragmatic Trade-offs for Modern Workloads',
      'Managing Kubernetes Ingress, SSL Certificates, and Cert-Manager at Scale',
      'GitOps Workflows with ArgoCD: Declarative Continuous Delivery',
      'Chaos Engineering in Production: Injecting Faults to Prove System Resilience',
      'Automated Vulnerability Scanning with Trivy and Snyk in DevOps Pipelines',
      'Edge Computing Architecture: Running Serverless Compute Closest to Users',
      'Site Reliability Engineering (SRE): Defining Meaningful SLIs, SLOs, and SLAs',
      'Blue-Green and Canary Deployment Strategies with Envoy Proxy',
      'Secrets Management with HashiCorp Vault in Kubernetes Clusters',
      'Monitoring Cloud Native Workloads with Prometheus, Grafana, and Alertmanager',
      'Mastering Docker Networking: Bridge, Host, Overlay, and Macvlan Modes',
      'Modern Infrastructure as Code with Pulumi and TypeScript',
      'Automated Database Backup and Point-in-Time Recovery in Cloud Deployments'
    ]
  },
  {
    category: 'Artificial Intelligence & Data',
    tags: ['ai', 'machinelearning', 'python'],
    titles: [
      'Retrieval-Augmented Generation (RAG): Production Architecture and Vector Search',
      'Fine-Tuning Open-Source LLMs for Domain-Specific Technical Knowledge',
      'Autonomous AI Agents: Orchestration, Memory, and Tool Calling Systems',
      'Prompt Engineering vs Semantic Caching: Reducing LLM Latency and Costs',
      'Building Enterprise Vector Search Pipelines with Hybrid Keyword Matching',
      'Ethical AI Guardrails: Content Filtering, Red Teaming, and Alignment',
      'Multimodal AI Applications: Combining Vision, Audio, and Text Embeddings',
      'LLM Evaluation Benchmarks: Measuring Hallucinations and Accuracy at Scale',
      'Deploying High-Performance Inference Servers with vLLM and TensorRT',
      'Synthetic Data Generation for Training Specialized Neural Networks',
      'Graph Neural Networks in Practice: Unlocking Relational Insights in Big Data',
      'Feature Store Architecture: Feast and Real-Time ML Feature Pipelines',
      'Explainable AI (XAI): SHAP and LIME Techniques for Model Transparency',
      'Quantization Techniques: Running 70B Parameter Models on Consumer Hardware',
      'Data Lakehouse Architecture: Apache Iceberg, Parquet, and Delta Lake',
      'Building Real-Time Fraud Detection Systems with Streaming ML Inference',
      'AI-Powered Code Assistants: How Context Retrieval Shapes Modern IDEs',
      'Reinforcement Learning from Human Feedback (RLHF): Step-by-Step Guide',
      'Time-Series Forecasting with Deep Learning: Transformers vs LSTM Models',
      'Privacy-Preserving Machine Learning: Federated Learning and Differential Privacy'
    ]
  },
  {
    category: 'Cybersecurity & Authentication',
    tags: ['security', 'auth', 'jwt', 'crypto'],
    titles: [
      'Securing JWT Authentication: HttpOnly Cookies, Refresh Token Rotation, and CSRF',
      'Defending Against SQL and NoSQL Injection: Parameterization and AST Sanitization',
      'Modern Password Storage: Argon2id vs Bcrypt vs PBKDF2 Benchmarked',
      'OAuth 2.1 and PKCE: Building Secure Third-Party Authorization Flows',
      'WebAuthn and Passkeys: Implementing Passwordless Authentication in 2026',
      'Cross-Site Scripting (XSS) Prevention: Content Security Policy (CSP) In-Depth',
      'API Security Checklist: OWASP Top 10 Vulnerabilities and Remediations',
      'Cryptographic Hashing and Digital Signatures Explained for Software Engineers',
      'Securing WebSockets and Server-Sent Events Against Spoofing Attacks',
      'Zero-Knowledge Proofs: Practical Applications in Privacy and Verification',
      'Penetration Testing 101: How Ethical Hackers Uncover Hidden Vulnerabilities',
      'Preventing Server-Side Request Forgery (SSRF) in Cloud-Connected APIs',
      'Session Fixation and Hijacking: Comprehensive Defense Mechanisms',
      'Software Bill of Materials (SBOM): Managing Supply Chain Security in Node.js',
      'Hardware Security Modules (HSM) and Cloud KMS: Protecting Master Keys',
      'Defending Microservices with Mutual TLS (mTLS) and SPIFFE Identities',
      'Building Secure File Upload Handlers: MIME Validation, Magic Bytes, and Sandbox',
      'Incident Response Playbook: What to Do When Your Production System is Breached',
      'Static Application Security Testing (SAST) Integration in CI Pipelines',
      'Demystifying Post-Quantum Cryptography: Lattice-Based Algorithms for the Future'
    ]
  },
  {
    category: 'Databases & Performance',
    tags: ['mongodb', 'database', 'performance'],
    titles: [
      'MongoDB Indexing Strategies: Compound, Partial, and TTL Indexes Explained',
      'Optimizing Mongoose Schemas and Queries for Ultra-Low Latency',
      'PostgreSQL vs MongoDB: Pragmatic Comparison for Modern Web Architectures',
      'Sharding and Partitioning Massive Datasets: Lessons from 100M+ Rows',
      'Understanding Database ACID Properties and Distributed Consensus (Raft)',
      'High-Performance MongoDB Aggregation Pipelines: Tips, Tricks, and Gotchas',
      'Database Replication Lag: Root Causes, Monitoring, and Mitigation Strategies',
      'Optimistic vs Pessimistic Locking in Concurrent Database Writes',
      'Full-Text Search in MongoDB with Atlas Search vs Dedicated Elasticsearch',
      'Time-Series Data Storage: Storing Millions of IoT Events in MongoDB',
      'Data Modeling Patterns in Document Databases: Embedding vs Referencing',
      'Database Performance Profiling: Identifying Slow Queries and Bottlenecks',
      'Redis Data Structures You Aren\'t Using (HyperLogLog, Bitmaps, Streams)',
      'Database Disaster Recovery: Automating Backup Validation and Health Tests',
      'Handling Unbounded Growth in MongoDB Arrays: The Bucket Pattern',
      'Transactions in NoSQL: When and How to Use Multi-Document ACID Transactions',
      'Graph Data Modeling: Exploring Complex Relationships in Document Stores',
      'Scaling Write-Heavy Workloads: Buffer Queues, Bulk Writes, and Sharding',
      'Zero-Downtime Database Version Upgrades in Mission-Critical Clusters',
      'Designing Multi-Tenant Database Schemas: Shared Database vs Separate Schemas'
    ]
  },
  {
    category: 'UI/UX Design & CSS',
    tags: ['css', 'design', 'uiux'],
    titles: [
      'Mastering Modern CSS: Subgrid, Container Queries, and Anchor Positioning',
      'Design Systems That Scale: Building Token-Driven Reusable Component Libraries',
      'The Science of Micro-Interactions: Enhancing Engagement Through Motion',
      'Accessible Web Design (WCAG 2.2): Practical Techniques for Everyday UI',
      'Dark Mode Done Right: Semantic Colors, Contrast Ratios, and Fluid Theming',
      'Typography Hierarchy: Choosing and Pairing Fonts for Readability and Impact',
      'Mobile-First vs Desktop-First: Responsive Layout Principles for Modern Screens',
      'Glassmorphism, Neumorphism, and Flat Design: When and Where to Use Each Style',
      'Color Theory for Developers: Building Harmonious Palettes with HSL and OKLCH',
      'Designing High-Converting Landing Pages: Visual Hierarchy and Call-to-Actions',
      'SVG Animation Techniques: CSS Keyframes vs GreenSock (GSAP) Performance',
      'Preventing Layout Shifts (CLS): Image Aspect Ratios, Dynamic Content, and Fonts',
      'The Psychology of Loading States: Skeletons, Spinners, and Perceived Speed',
      'Crafting Intuitive Form UX: Inline Validation, Floating Labels, and Step Flows',
      'CSS Grid vs Flexbox: The Ultimate Mental Model and Practical Decision Guide',
      'User Research on a Budget: Usability Testing Methods for Independent Creators',
      'Designing for Touch: Target Sizes, Gestures, and Thumb Zones on Mobile',
      'Microcopy That Converts: Writing Clear, Helpful, and Engaging UI Text',
      'Adaptive Layouts: Designing for Foldables, Ultra-Wide Monitors, and Watches',
      'CSS Houdini and Custom Paint API: Extending Browser Styles Beyond Limits'
    ]
  },
  {
    category: 'Systems & Emerging Tech',
    tags: ['rust', 'golang', 'systems'],
    titles: [
      'Why Rust is Reshaping Systems Programming: Memory Safety Without Garbage Collection',
      'Go Concurrency Patterns: Channels, Goroutines, and Worker Pools Demystified',
      'Building High-Performance Network Proxies with Rust and Tokio',
      'Linux Kernel Internals: How System Calls and Epoll Power High-Concurreny Servers',
      'Understanding CPU Caching (L1, L2, L3) and Cache-Friendly Data Structures',
      'WebAssembly Beyond the Browser: WASI and Server-Side Micro-Runtimes',
      'Memory Management in C++ vs Rust: RAII, Smart Pointers, and Ownership Rules',
      'Building Custom Command-Line Tools with Rust and Clap for Developer Productivity',
      'Distributed Hash Tables (DHT) and Peer-to-Peer Network Architecture',
      'Benchmarking and Profiling Native Code with Perf, Valgrind, and Flamegraphs',
      'Building Low-Latency Trading Engines: Cache Lines, Branch Prediction, and SIMD',
      'Operating System Boot Process: From BIOS/UEFI to Kernel Init and User Space',
      'Embedded Systems and IoT: Writing Firmware in Modern Rust with Embedded-HAL',
      'Compilers from Scratch: Lexing, Parsing, and Code Generation in Go',
      'Network Packet Inspection and Filtering with eBPF in Linux',
      'Understanding Memory-Mapped Files (mmap) for Terabyte-Scale Data Processing',
      'Writing Safe Concurrency in Rust: Mutex, RwLock, Arc, and Atomics',
      'High-Performance Serialization: FlatBuffers, Cap\'n Proto, and Protobuf',
      'Virtual File Systems (VFS): How Linux Manages Devices, Pipes, and Sockets',
      'The Philosophy of Modern Software Engineering: Craftsmanship, Simplicity, and Pragmatism'
    ]
  },
  {
    category: 'Mobile & Cross-Platform',
    tags: ['mobile', 'flutter', 'reactnative'],
    titles: [
      'Flutter vs React Native in 2026: Performance, Ecosystem, and Architecture',
      'Building Smooth 60fps Mobile Animations: Render Trees and Repaint Boundaries',
      'Offline Data Synchronization in Mobile Apps: SQLite, WatermelonDB, and CRDTs',
      'Push Notification Architecture: APNs, FCM, and Silent Background Delivery',
      'Deep Linking and Universal Links: Seamless Navigation from Web to Mobile',
      'Mobile App Security: Certificate Pinning, Obfuscation, and KeyChain Storage',
      'Native Device Interop: Method Channels and JSI in Hybrid Mobile Frameworks',
      'Battery Life and Performance Optimization: Profiling CPU and Background Tasks',
      'App Store Optimization (ASO): Screenshots, Keywords, and Conversion Strategy',
      'Automated Mobile Testing: Maestro, Appium, and Detox in CI Pipelines',
      'Building Dynamic Island and Live Activity Widgets for iOS in SwiftUI',
      'Managing State Across Complex Mobile Workflows with Bloc and Riverpod',
      'In-App Purchases and Subscription Architecture: RevenueCat and StoreKit 2',
      'Optimizing Mobile Image Loading: Caching, Pre-fetching, and Thumbnail Resizing',
      'Building Responsive Tablet and Foldable Mobile Layouts with Adaptive Scaffolds',
      'Bluetooth Low Energy (BLE) Integration in Cross-Platform Mobile Applications',
      'Accessibility on Mobile: Screen Readers, Dynamic Type, and Voice Over Best Practices',
      'Migrating Legacy Mobile Codebases to Modern Declarative UI Frameworks',
      'Thermal Throttling and Memory Pressure: Keeping Mobile Games and Apps Cool',
      'The Future of Wearable Apps: Designing for Smartwatches and Spatial Computing'
    ]
  },
  {
    category: 'Developer Career & Productivity',
    tags: ['career', 'productivity', 'engineering'],
    titles: [
      'The Senior Engineer Mindset: Moving from Writing Code to Multiplying Impact',
      'How to Conduct High-Impact Code Reviews That Elevate the Whole Team',
      'Effective Technical Writing: Documenting Architecture Decision Records (ADRs)',
      'Combating Developer Burnout: Boundaries, Deep Work, and Sustainable Output',
      'System Design Interview Blueprint: Breaking Down Distributed Architectures',
      'Mastering Git: Interactive Rebasing, Bisecting Bugs, and Tree Recovery',
      'Building a Tech Blog That Reaches 100k Monthly Developers',
      'The Power of Open Source: How Contributing Code Changed My Tech Career',
      'Remote Work Playbook for Software Engineers: Asynchronous Collaboration',
      'From Monolith to Microservices: The Cultural Shift Required for Success',
      'Debugging Complex Production Incidents: Methodologies of Top SRE Teams',
      'Writing Clean Pull Requests That Get Approved Fast and Without Friction',
      'Technical Debt Management: Pragmatic Strategies for Refactoring Live Systems',
      'Choosing Your Tech Stack Wisely: Innovation Tokens and Boring Technology',
      'Mastering the Command Line: Zsh, Tmux, Fzf, and Shell Scripting Superpowers',
      'Mentoring Junior Developers: Fostering Growth, Autonomy, and Confidence',
      'The Architecture of High-Performing Engineering Teams: Autonomy and Alignment',
      'Continuous Learning in Tech: Staying Ahead of the Rapid Technological Curve',
      'Building Side Projects That Actually Launch: From Idea to First 1,000 Users',
      'The Art of Problem Solving: Breaking Down Ambiguous Engineering Challenges'
    ]
  }
];

/**
 * Generates an engaging, structured article body with introductions, key insights,
 * bulleted takeaways, and practical advice tailored to the title and tags.
 */
function generateArticleContent(title, category, tags, authorUsername) {
  const primaryTag = tags[0] || 'engineering';
  return `## Overview

In today's fast-moving software landscape, **${title}** represents one of the most critical subjects for engineers and architects looking to build durable, scalable systems. As modern applications demand higher availability, tighter security, and rapid iteration, having a rock-solid grasp of ${category.toLowerCase()} principles separates good implementations from world-class software.

Written by **@${authorUsername}**, this guide dives into the fundamental architecture, key patterns, production tradeoffs, and best practices that you can directly apply in your projects today.

---

### Key Architectural Pillars

When designing solutions around **${primaryTag}**, engineers frequently face complex tradeoffs between performance, maintainability, and implementation velocity:

1. **Scalability and Resilience**: Ensuring that systems degrade gracefully under heavy load and maintain high throughput during traffic spikes.
2. **Defensive Design Patterns**: Applying rigorous input validation, explicit error boundaries, and comprehensive monitoring across the stack.
3. **Developer Ergonomics**: Maintaining clean abstractions that simplify testing, continuous deployment, and collaborative teamwork.
4. **Data Integrity & Consistency**: Choosing the right consistency models, caching tiers, and failover mechanics to guarantee reliability.

> *"Simplicity is prerequisite for reliability. Complex architectures create opaque failure modes that compound during unexpected incidents."*

---

### Practical Implementation Strategies

Here are the concrete recommendations and lessons learned from deploying these patterns in high-throughput environments:

* **Adopt Explicit Contracts**: Whether defining REST schemas, gRPC protobufs, or UI component APIs, enforce strict typings and boundary validations.
* **Observe Everything**: Instrumentation via structured logs, distributed tracing, and real-time metric dashboards is non-negotiable for production operations.
* **Automate Early**: Automate linting, unit tests, integration suites, and security scans in your CI/CD pipelines before technical debt accumulates.
* **Decouple Components**: Separate concerns cleanly so changes to one subsystem do not trigger cascading regressions across unrelated modules.

---

### Summary & Next Steps

Mastering **${title.toLowerCase()}** requires a continuous cycle of experimentation, measurement, and iterative refactoring. By focusing on fundamental design principles and prioritizing automated verification, teams can confidently deliver resilient features at scale.

Have thoughts or real-world experiences with this approach? Share your thoughts, bookmark this article, and explore related stories in the community feed!`;
}

/**
 * Generates an excerpt snippet under 250 characters.
 */
function generateSnippet(title, category) {
  return `An in-depth exploration of ${title.toLowerCase()}, covering real-world architectural tradeoffs, performance optimization, and practical production strategies.`;
}

/**
 * Main seeding orchestrator.
 */
async function seedDatabase() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blog_xp';
  console.log(`Connecting to MongoDB at: ${mongoUri}...`);

  await mongoose.connect(mongoUri);
  console.log('[MongoDB] Connected successfully.');

  // 1. Seed or Upsert the 30 distinct user profiles
  console.log(`Checking and seeding ${USER_PROFILES.length} user accounts...`);
  const salt = await bcrypt.genSalt(10);
  const commonHashedPassword = await bcrypt.hash('password123', salt);

  const createdUsers = [];
  for (const profile of USER_PROFILES) {
    let user = await User.findOne({ username: profile.username });
    if (!user) {
      user = await User.create({
        username: profile.username,
        email: profile.email,
        password: commonHashedPassword,
        role: profile.role || 'user',
        profileImage: profile.avatar || '/images/avatars/face-1.svg',
      });
      console.log(`+ Created user: @${user.username} (${user.email})`);
    } else {
      // Update avatar if not set
      if (!user.profileImage || user.profileImage === '/images/default-avatar.svg') {
        user.profileImage = profile.avatar;
        await user.save();
      }
    }
    createdUsers.push(user);
  }

  console.log(`Successfully verified ${createdUsers.length} active users.`);

  // 2. Prepare 200 distinct blog posts with balanced images and videos
  console.log('Generating 200 distinct test blogs with rich media (images and videos)...');

  // Clear existing blogs so we have a clean, balanced dataset of exactly 200 items
  const deletedCount = await Blog.deleteMany({});
  console.log(`Cleared ${deletedCount.deletedCount} prior blog posts.`);

  const blogsToInsert = [];
  const totalBlogs = 200;

  // Flatten the 10 topic categories (each having 20 titles = 200 total unique titles!)
  const flattenedTopics = [];
  TOPIC_TEMPLATES.forEach((template) => {
    template.titles.forEach((title) => {
      flattenedTopics.push({
        title,
        category: template.category,
        tags: template.tags,
      });
    });
  });

  console.log(`Available unique topic titles: ${flattenedTopics.length}`);

  // Stagger publication dates over the last 180 days so the feed looks natural and chronologically distributed
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const totalDaysSpan = 180;

  for (let i = 0; i < totalBlogs; i++) {
    const topic = flattenedTopics[i % flattenedTopics.length];
    const authorUser = createdUsers[i % createdUsers.length];

    // Distribute media: Exactly 50% Images (100) and 50% Videos (100)
    const isVideo = i % 2 === 1;
    let mediaType;
    let mediaUrl;

    if (isVideo) {
      mediaType = 'video';
      mediaUrl = VIDEO_MEDIA[Math.floor(i / 2) % VIDEO_MEDIA.length];
    } else {
      mediaType = 'image';
      mediaUrl = IMAGE_MEDIA[Math.floor(i / 2) % IMAGE_MEDIA.length];
    }

    // Stagger timestamp: i = 0 is latest (today), i = 199 is ~180 days ago
    const dayOffset = (i / totalBlogs) * totalDaysSpan;
    const hourOffset = (i % 24) * 3600 * 1000;
    const createdAtDate = new Date(now - (dayOffset * oneDayMs + hourOffset));

    const content = generateArticleContent(topic.title, topic.category, topic.tags, authorUser.username);
    const snippet = generateSnippet(topic.title, topic.category);

    blogsToInsert.push({
      title: topic.title,
      snippet,
      content,
      author: authorUser._id,
      tags: topic.tags,
      mediaUrl,
      mediaType,
      createdAt: createdAtDate,
      updatedAt: createdAtDate,
    });
  }

  console.log(`Inserting ${blogsToInsert.length} blogs into MongoDB...`);
  const insertedBlogs = await Blog.insertMany(blogsToInsert);

  const imageCount = insertedBlogs.filter((b) => b.mediaType === 'image').length;
  const videoCount = insertedBlogs.filter((b) => b.mediaType === 'video').length;

  console.log('===========================================================');
  console.log(' SEEDING COMPLETE!');
  console.log(` Total blogs created: ${insertedBlogs.length}`);
  console.log(` Total image blogs:   ${imageCount}`);
  console.log(` Total video blogs:   ${videoCount}`);
  console.log(` Across users:        ${createdUsers.length} distinct authors`);
  console.log('===========================================================');

  await mongoose.disconnect();
  console.log('MongoDB connection cleanly closed.');
  process.exit(0);
}

// Execute Seeding
seedDatabase().catch((err) => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
