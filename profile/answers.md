# Anish Tripathi: answers file

This is the only file the bot uses for facts about you. Edit it, commit, and redeploy to change what the bot says. Write everything in plain first-person-friendly English. Keep it to facts you are happy for an interviewer to hear.

## Basics
- Name: Anish Tripathi
- Location: New Delhi, India (based in Dwarka; open to remote, hybrid, and relocation roles)
- Email: tripathianish12@gmail.com | anish.tripathi.work@gmail.com
- Role: AI/ML and MLOps Engineer with two years of production experience building, containerizing, and deploying machine learning and GenAI systems on AWS.

## Experience
- AI/ML Developer at Software Technology Parks of India (STPI), Ministry of Electronics and Information Technology (MeitY), contract, July 2024 to July 2026, New Delhi.
  - Built a Python-based recommendation system using profile and in-app activity data for 7,500+ users, improving content discovery and contributing to about a 40% increase in engagement.
  - Built and maintained automated dashboard reports across 10+ product and business KPIs (usage trends, activity levels, engagement patterns), contributing to about a 30% reduction in manual reporting effort.
  - Analysed core platform metrics—active users, retention, and feature adoption—to guide product reviews and feature prioritization decisions.
  - Built a rule-based chatbot on MySQL-stored data to automate user onboarding and recurring support queries, reducing manual support load.
  - Contributed to national digital governance portals under MeitY, including the AMBUD portal (Cloud Service Provider empanelment, STQC audit tracking, SSL updates, and Business Requirements Document scope expansion), the EMC 2.0 scheme portal (module development, expenditure configuration, and staging VM setup), and the WACE platform.
  - Why I left: I left by choice in July 2026. A contract extension was offered, but the day-to-day work had plateaued into legacy maintenance and governance reporting rather than modern ML infrastructure. I turned down the extension to focus full-time on production MLOps, Kubernetes orchestration, and GenAI engineering.
- Research Intern at Centre for Development of Telematics (C-DOT), June 2023 to July 2023, New Delhi.
  - Analysed 10,000+ coastal sensor records across 5 regions using Python (Pandas and NumPy) to detect anomalies, identify storm patterns, and assess region-wise risk.
  - Built Power BI dashboards that translated complex sensor and equipment-health trends into clear reports for stakeholders.

## Projects
- NLP Sentinel MLOps — Cloud-Native Sentiment Analysis Platform (https://github.com/anish3565/NLP_Sentinel_Mlops)
  - What it is: An end-to-end cloud-native MLOps platform for real-time NLP sentiment inference.
  - Data & Experiment Tracking: Used DVC and AWS S3 for reproducible data versioning, and MLflow with DagsHub for experiment tracking and model registry.
  - Infrastructure as Code: Provisioned the entire AWS stack (VPC, EKS cluster, ECR repositories, S3 buckets, and IAM roles) using Terraform, replacing manual AWS console setup and cutting environment provisioning time from hours to minutes.
  - CI/CD & Serving: Served the model via Flask, containerized it with Docker, pushed images to AWS ECR, and deployed to managed Kubernetes (AWS EKS) through automated GitHub Actions build-test-deploy pipelines using kubectl and eksctl.
  - Observability: Deployed Prometheus and Grafana on AWS EC2 to scrape and visualize live inference latency and request throughput in real time.
- Vehicle Insurance MLOps Pipeline — Production ML System (https://github.com/anish3565/Vehicle_Insurance_MLOps_Pipeline)
  - What it is: An automated production ML pipeline that predicts customer insurance policy responses.
  - Data & Quality Gates: Ingests data from MongoDB Atlas with automated schema validation and a strict model evaluation gate—a newly trained model is promoted to production only if it outperforms the currently deployed production model by a defined margin.
  - Serving & Deployment: Served low-latency predictions via FastAPI; automated Docker image builds, AWS ECR pushes, and continuous deployment to a self-hosted AWS EC2 runner using GitHub Actions CI/CD.
- Product Research AI Agent (https://github.com/anish3565/Product_Research_AI_Agent)
  - What it is: A multi-agent GenAI research pipeline built with CrewAI and local LLMs via Ollama.
  - Architecture: Orchestrates 4 autonomous agents over 10,000+ patents using hybrid retrieval—combining keyword search (SERP API) and semantic vector search (OpenSearch)—and delivers insights through both a CLI and a Streamlit web interface.

## Technical Q&A and Architectural Trade-offs

### NLP Sentinel MLOps (EKS, Terraform, Flask, DVC, Prometheus)

- Why did you use AWS EKS (Kubernetes) here when a single EC2 instance is cheaper and simpler?
  - For a single static model, EC2 is cheaper. I used AWS EKS in NLP Sentinel specifically to engineer for horizontal pod autoscaling, zero-downtime rolling updates, and multi-replica resilience under variable inference traffic. Because EKS is expensive to leave running, I provisioned the entire stack—VPC, EKS cluster, ECR, S3, and IAM—with Terraform so I can spin the infrastructure up in minutes for testing and tear it down cleanly with a single command to eliminate idle cloud burn.
- Why did you use Flask for NLP Sentinel instead of FastAPI?
  - In NLP Sentinel, the bottleneck is CPU-bound text preprocessing and model inference rather than high-concurrency asynchronous I/O. Running Flask behind a production WSGI server like Gunicorn with multiple worker processes inside Kubernetes pods kept the serving layer lightweight while letting EKS handle horizontal scaling across pods. For my Vehicle Insurance pipeline, I switched to FastAPI to get native Pydantic schema validation, async request handling, and automatic OpenAPI docs on a single EC2 instance.
- How do DVC and MLflow work together without overlapping?
  - They solve two different parts of the reproducibility problem. DVC versions the raw and processed datasets stored on AWS S3 using lightweight Git-tracked pointer files, so I never bloat my Git repository with large data files. MLflow, hosted on DagsHub, tracks hyperparameters, evaluation metrics, and the serialized model artifacts. Together, they let me trace any production model in the registry back to the exact code commit and exact S3 dataset snapshot that produced it.
- What exactly do you monitor with Prometheus and Grafana, and what is missing?
  - Right now, Prometheus scrapes operational system metrics from the service—request throughput, HTTP error rates, CPU/memory utilization, and p95/p99 inference latency—and visualizes them on a Grafana dashboard hosted on EC2. If I were extending this for long-term production, the next layer I would add is data drift and prediction distribution monitoring using Evidently AI to trigger automated retraining when live sentiment inputs diverge from the training baseline.

### Vehicle Insurance MLOps Pipeline (FastAPI, MongoDB Atlas, EC2, Evaluation Gates)

- Why did you ingest data from MongoDB Atlas instead of a relational database or flat S3 files?
  - Insurance customer records and policy telemetry often arrive as semi-structured JSON payloads from web applications where fields evolve over time. MongoDB Atlas fits that document ingestion pattern naturally. To prevent "schema-less" chaos from breaking downstream feature engineering, I built a strict schema validation step right at pipeline ingress—Checking column types, null thresholds, and expected distributions before the data ever hits the training stage.
- How does your automated model evaluation gate prevent bad deployments?
  - In automated retraining, a new model isn't automatically a better model—data noise can easily degrade accuracy. My evaluation stage pulls the currently deployed production model from S3, evaluates both the candidate model and the production model on a holdout test split, and requires the new model to beat the production baseline by a configured metric threshold. If it fails that gate, the pipeline aborts promotion and leaves the existing production container untouched.
- Why deploy this pipeline to a self-hosted AWS EC2 runner instead of EKS?
  - Cost-to-throughput trade-off. Tabular insurance inference using tree-based or standard scikit-learn models takes milliseconds on CPU and has predictable traffic. Paying the fixed control-plane and worker-node overhead of AWS EKS for a single tabular service is over-engineering. Using a self-hosted GitHub Actions runner on an EC2 instance gave me fast, zero-cost CI/CD runner execution and sub-minute Docker container rollouts via AWS ECR.
- What is the main failure mode of a single EC2 self-hosted runner architecture?
  - It is a single point of failure (SPOF)—if the EC2 instance runs out of disk space from old Docker images or crashes during a traffic spike, both CI/CD runner jobs and live inference go down. To mitigate this on a single node, I use Docker restart policies and prune dangling images during CI/CD, and to scale it for enterprise production, I would decouple the GitHub Actions runner from the serving node and place the FastAPI container behind an Application Load Balancer on AWS ECS Fargate.

### Product Research AI Agent (CrewAI, Ollama, OpenSearch, SERP API)

- Why did you build hybrid retrieval (SERP API + OpenSearch) instead of pure vector RAG?
  - Patent documents are full of exact legal terminology, chemical formulas, patent IDs, and specific claim numbers. Pure dense vector embeddings frequently miss exact keyword or serial-number matches because they compress text into semantic concepts. By combining keyword and live search via SERP API with semantic vector retrieval in OpenSearch, the system gets high recall on conceptual similarity while preserving exact lexical precision on technical terms.
- Why use 4 separate CrewAI agents instead of a single mega-prompt?
  - A single prompt trying to search 10,000+ patents, filter noise, analyze prior art, and synthesize a structured product brief suffers from context-window degradation ("lost in the middle" syndrome) and high hallucination rates. Splitting the workflow across 4 specialized CrewAI agents—each with a scoped role, strict tool access, and structured handoff outputs—acts like a microservice pipeline for reasoning, making it much easier to debug which step failed.
- What are the trade-offs of running local LLMs via Ollama vs. cloud APIs like OpenAI or Claude?
  - The main wins with Ollama are data privacy—crucial when researching proprietary R&D and patent strategy—and zero per-token API cost, which matters because multi-agent loops consume 5x to 10x more tokens than single-turn chat. The trade-off is local compute latency and weaker tool-calling reliability on smaller quantized models (like 7B or 8B parameter models), which requires stricter output parsing and retry guardrails in CrewAI.

## Education
- B.Tech in Instrumentation and Control Engineering, Netaji Subhas University of Technology (NSUT), New Delhi, December 2020 to May 2024 (CGPA: 7.60).
- Class XII (CBSE), N.K. Bagrodia Public School, Dwarka Sector-3, New Delhi, 2020: 93.4%

## Skills
- Cloud & Infrastructure: AWS (EC2, EKS, ECR, S3, IAM), Terraform (IaC), Docker, Kubernetes (kubectl, eksctl), Vercel.
- MLOps & Observability: MLflow, DVC, DagsHub, GitHub Actions (CI/CD), Prometheus, Grafana.
- Programming, Backend & Data: Python, FastAPI, Flask, REST APIs, SQL, MySQL, MongoDB Atlas, Pandas, NumPy, Scikit-learn, XGBoost, Power BI.
- GenAI & Agentic Workflows: LangChain, CrewAI, Ollama, Hugging Face, RAG, OpenSearch, SERP API, Streamlit.

## Links
- GitHub: https://github.com/anish3565
- LinkedIn: https://www.linkedin.com/in/anishtri

## Personal answers

### Life story
I was born and raised in New Delhi and completed my B.Tech in Instrumentation and Control Engineering from NSUT in 2024. Even during my engineering degree, I gravitated toward data and software systems, which led to my research internship at C-DOT analyzing coastal sensor networks and then a two-year role as an AI/ML Developer at STPI under the Ministry of Electronics and IT. At STPI, I built recommendation systems, analytics dashboards, and supported national cloud governance platforms. In July 2026, I made a deliberate decision to turn down a contract extension because I didn't want to get comfortable maintaining legacy systems. Since then, I have been heads-down building production-grade MLOps architectures—wiring together Terraform, AWS EKS, FastAPI, MLflow, and Prometheus—so I can bridge the gap between data science models and resilient cloud infrastructure. Outside of work, I play football, spend time with my dog Rio, and enjoy learning by building end-to-end systems.

### Superpower
My superpower is end-to-end systems thinking and reproducibility. Many data scientists stop once a model hits a good F1-score in a Jupyter notebook, and many DevOps engineers treat ML models like static black boxes. I bridge both sides: I take a raw dataset in MongoDB or S3 and wire the entire production lifecycle—schema validation, DVC data versioning, MLflow tracking, automated evaluation gates, Terraform infrastructure provisioning, Docker containerization on EKS or EC2, and live Prometheus/Grafana monitoring.

### Areas to grow
Right now, I am focused on deepening my expertise in two areas: large-scale distributed GPU orchestration—such as serving and fine-tuning LLMs with vLLM, Ray, and Kubernetes GPU operators—and high-throughput real-time feature streaming using tools like Kafka. Most of my production pipelines so far handle batch or standard REST microservice traffic, so scaling to sub-50ms high-concurrency streaming inference is the next frontier I am actively studying.

### Coworkers' misconception
Because I am very direct, terminal-focused, and care deeply about clean system architecture and automation, new coworkers sometimes assume I only want to sit in a corner writing backend infrastructure code. Once they work with me, they realize I actually enjoy cross-functional problem-solving—at STPI, I regularly translated messy Business Requirements Documents, coordinated with Cloud Service Providers and STQC auditors, and built KPI dashboards specifically to make life easier for non-technical product and operations teams.

### Pushing boundaries and limits
The biggest example was walking away from a guaranteed contract extension at STPI in July 2026. Leaving a stable government-backed technical role without another offer lined up was uncomfortable, but I knew staying would stagnate my engineering growth. I treated the transition like a full-time engineering sprint—teaching myself Kubernetes on AWS EKS, Terraform IaC, and Prometheus observability from scratch, and shipping complete, reproducible MLOps pipelines rather than half-finished tutorials.

### Feedback and weaknesses
Earlier in my career, I had a tendency to over-engineer the first version of a system or spend too long perfecting the infrastructure setup before getting user feedback. When working or upskilling independently, I also noticed that going down deep technical rabbit holes without strict checkpoints could slow down my delivery pace. I addressed this by adopting a strict two-phase workflow: first, ship a minimal end-to-end baseline (data ingress to FastAPI endpoint) as fast as possible, and second, layer on Terraform, evaluation gates, and Grafana monitoring iteratively using time-boxed milestones.

### Next role
I am looking for an MLOps Engineer, ML Platform Engineer, or Production AI/ML Engineer role where I can own the reliability, deployment, and scaling of machine learning and GenAI systems in production. I thrive in environments that value reproducible pipelines, CI/CD automation, and cloud-native infrastructure on AWS, and I am open to both remote roles and hybrid or on-site positions.

### Salary and compensation
Rule: Deflect politely to discover the role's scope first; if pressed for a number, anchor to market rates for a 2-year production AI/ML and MLOps Engineer.
- Default answer: "I'm mainly looking for a team where I can own real AI agent and production work. Could you share the budgeted range for this role and how it splits between fixed pay, bonus and equity?"
- If pressed for a number: "Based on the scope of this role and my work with AI agents, RAG and production deployments, I am looking at roughly 12 to 20 lakh per annum but I am open to negotiation depending on the role, growth, and salary structure."
- If asked about my last drawn or current pay: "I would prefer to focus on the value I bring and the range for this role. My last role was a contract position at STPI, and my expectation is the range I just shared."
- If asked about notice period or joining: "I am not serving a notice period and can join immediately."
- Never state an upper limit on my range, and never give a number below 12 lakh per annum.