#!/usr/bin/env python3
"""
Simple markdown to PDF converter using reportlab
"""
import sys

def create_pdf():
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
    except ImportError:
        print("Installing reportlab...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab", "-q"])
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

    pdf_path = r"d:\projects\student-helper\StreamFlow_Architecture_Design.pdf"
    
    doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=0.75*inch, leftMargin=0.75*inch)
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title_text = "StreamFlow: Enterprise VoD Architecture Design"
    story.append(Paragraph(title_text, styles['Heading1']))
    story.append(Spacer(1, 0.3*inch))
    
    # Metadata
    metadata_text = """
    <b>Version:</b> 1.0<br/>
    <b>Date:</b> May 25, 2026<br/>
    <b>Status:</b> Architecture Approved<br/>
    <b>Platform:</b> Video on Demand (VoD) Streaming<br/>
    """
    story.append(Paragraph(metadata_text, styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    story.append(PageBreak())
    
    # TOC
    story.append(Paragraph("Table of Contents", styles['Heading1']))
    story.append(Spacer(1, 0.1*inch))
    
    toc_items = [
        "1. Executive Summary",
        "2. System Architecture",
        "3. Functional Requirements",
        "4. Non-Functional Requirements (NFRs)",
        "5. Technology Stack",
        "6. Architectural Decision Records (ADRs)",
        "7. Technical Constraints & Solutions",
        "8. Implementation Roadmap",
        "9. Key Performance Indicators"
    ]
    
    for item in toc_items:
        story.append(Paragraph(f"• {item}", styles['Normal']))
    
    story.append(Spacer(1, 0.3*inch))
    story.append(PageBreak())
    
    # Executive Summary
    story.append(Paragraph("Executive Summary", styles['Heading1']))
    story.append(Spacer(1, 0.15*inch))
    
    exec_summary = """
    <b>StreamFlow</b> is an enterprise-grade Video on Demand (VoD) platform designed to deliver 
    high-quality video content to millions of concurrent viewers globally. The architecture prioritizes 
    scalability, reliability, performance, and cost efficiency.
    <br/><br/>
    <b>Key Architectural Objectives:</b>
    <br/>• <b>Scalability:</b> Handle 100,000+ concurrent viewers with automatic scaling
    <br/>• <b>Reliability:</b> 99.95% uptime SLA with multi-region failover
    <br/>• <b>Performance:</b> &lt;2 second start-to-play latency with adaptive bitrate streaming
    <br/>• <b>Cost Efficiency:</b> Optimized egress through multi-CDN strategy
    <br/>• <b>Security:</b> End-to-end encryption, DRM, and compliance (GDPR/CCPA)
    """
    story.append(Paragraph(exec_summary, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # System Architecture
    story.append(Paragraph("System Architecture", styles['Heading1']))
    story.append(Spacer(1, 0.15*inch))
    
    arch_text = """
    The StreamFlow architecture follows a layered approach, separating concerns across 
    ingestion, processing, storage, delivery, and playback tiers. This design enables 
    independent scaling and failure isolation across each component.
    """
    story.append(Paragraph(arch_text, styles['Normal']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Core Components", styles['Heading2']))
    
    components = [
        ("Content Ingestion", "Multi-part upload with resume capability, format validation, and async job queuing"),
        ("Processing Layer", "Transcoding service generating multiple bitrate variants, metadata extraction, thumbnail generation"),
        ("Storage Layer", "S3 for video content, PostgreSQL for metadata, Redis for sessions, Blob Storage for thumbnails"),
        ("CDN Layer", "Multi-CDN strategy with Cloudflare and Akamai for global edge delivery"),
        ("API Gateway", "Authentication, rate limiting, request routing, and manifest generation"),
        ("Playback Layer", "Mobile (React Native), Web (React/Vue), and Smart TV clients"),
        ("Analytics", "User behavior tracking, engagement metrics, and performance monitoring")
    ]
    
    for comp_name, comp_desc in components:
        text = f"<b>{comp_name}:</b> {comp_desc}"
        story.append(Paragraph(text, styles['Normal']))
        story.append(Spacer(1, 0.08*inch))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # Functional Requirements
    story.append(Paragraph("Functional Requirements", styles['Heading1']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Core Features", styles['Heading2']))
    
    features_text = """
    <b>FR-001:</b> Video Upload - Users can upload videos with automatic format validation and transcoding<br/>
    <b>FR-002:</b> Multi-Bitrate Playback - Platform supports adaptive bitrate streaming (480p → 4K)<br/>
    <b>FR-003:</b> Resume Playback - Users can resume from the last watched timestamp (within 7 days)<br/>
    <b>FR-004:</b> Search & Discovery - Full-text search across video metadata and thumbnails<br/>
    <b>FR-005:</b> Playlist Management - Users can create and manage watchlists<br/>
    <b>FR-006:</b> User Authentication - Secure authentication with role-based access control (RBAC)<br/>
    <b>FR-007:</b> DRM & Content Protection - Widevine/PlayReady DRM for premium content<br/>
    <b>FR-008:</b> Subtitle Support - Multi-language subtitle management and delivery<br/>
    <b>FR-009:</b> Analytics & Insights - Track user engagement, watch time, and completion rates<br/>
    <b>FR-010:</b> Social Sharing - Generate shareable links with preview metadata
    """
    story.append(Paragraph(features_text, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # NFRs
    story.append(Paragraph("Non-Functional Requirements (NFRs)", styles['Heading1']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Availability & Reliability", styles['Heading2']))
    nfr_avail = """
    <b>Uptime SLA:</b> 99.95% (Maximum 22 minutes downtime per month)<br/>
    <b>Recovery Time Objective (RTO):</b> &lt; 5 minutes for regional failure<br/>
    <b>Recovery Point Objective (RPO):</b> &lt; 1 minute maximum data loss<br/>
    <b>Service Degradation:</b> 99.9% during partial regional outage
    """
    story.append(Paragraph(nfr_avail, styles['Normal']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Performance & Latency", styles['Heading2']))
    nfr_perf = """
    <b>Time-to-First-Frame:</b> &lt; 2 seconds from click to playback start<br/>
    <b>Manifest Generation:</b> &lt; 100ms server-side generation time<br/>
    <b>API Response Time (P95):</b> &lt; 200ms latency<br/>
    <b>CDN Cache Hit Ratio:</b> &gt; 95% of edge-cached requests<br/>
    <b>Average Bitrate Start:</b> 720p (3 Mbps) with intelligent initial quality selection
    """
    story.append(Paragraph(nfr_perf, styles['Normal']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Scalability", styles['Heading2']))
    nfr_scale = """
    <b>Concurrent Viewers:</b> 100,000+ per content item<br/>
    <b>Daily Active Users:</b> 10 million total platform<br/>
    <b>Auto-Scaling Response:</b> &lt; 2 minutes for new instance readiness<br/>
    <b>Transcoding Throughput:</b> 1000+ videos per day with horizontal scaling
    """
    story.append(Paragraph(nfr_scale, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # Technology Stack
    story.append(Paragraph("Technology Stack", styles['Heading1']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Backend Services", styles['Heading2']))
    tech_backend = """
    <b>Runtime:</b> Node.js 20 LTS / Python 3.11<br/>
    <b>Web Framework:</b> Express.js / FastAPI<br/>
    <b>Message Queue:</b> RabbitMQ / AWS SQS<br/>
    <b>Caching Layer:</b> Redis Cluster 7.0<br/>
    <b>Job Scheduler:</b> Bull Queue / Celery
    """
    story.append(Paragraph(tech_backend, styles['Normal']))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("Storage & Databases", styles['Heading2']))
    tech_storage = """
    <b>Video Storage:</b> Amazon S3 / Google Cloud Storage<br/>
    <b>Object Backup:</b> S3 Cross-Region Replication<br/>
    <b>User Metadata:</b> PostgreSQL 15 (Primary DB)<br/>
    <b>Session Store:</b> Redis Cluster<br/>
    <b>CDN:</b> Multi-CDN (Cloudflare + Akamai)
    """
    story.append(Paragraph(tech_storage, styles['Normal']))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("Media Processing", styles['Heading2']))
    tech_media = """
    <b>Transcoding Engine:</b> AWS Elemental MediaConvert / FFmpeg Cluster<br/>
    <b>Video Codec:</b> H.264, VP9, AV1<br/>
    <b>Audio Codec:</b> AAC, Opus<br/>
    <b>Container Format:</b> MP4 (storage), TS (streaming)
    """
    story.append(Paragraph(tech_media, styles['Normal']))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("Streaming Protocols", styles['Heading2']))
    tech_stream = """
    <b>Primary:</b> HLS (HTTP Live Streaming) with hls.js<br/>
    <b>Secondary:</b> DASH (Dynamic Adaptive Streaming) with dash.js<br/>
    <b>Live Events:</b> WebRTC for sub-second latency<br/>
    <b>ABR:</b> Custom adaptive bitrate algorithm
    """
    story.append(Paragraph(tech_stream, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # ADRs Summary
    story.append(Paragraph("Architectural Decision Records (ADRs)", styles['Heading1']))
    story.append(Spacer(1, 0.15*inch))
    
    adr_intro = """
    All major technology choices are documented through Architectural Decision Records (ADRs) 
    to ensure decisions are based on logic rather than resume-driven development.
    """
    story.append(Paragraph(adr_intro, styles['Normal']))
    story.append(Spacer(1, 0.15*inch))
    
    adr_text = """
    <b>ADR-001: Storage (S3 vs. Block Storage)</b><br/>
    Decision: Use S3 for video archival and delivery<br/>
    Rationale: 4-5x cost savings, unlimited scalability, native CDN integration, 99.999999999% durability<br/>
    <br/>
    
    <b>ADR-002: Streaming Protocol (HLS vs. DASH vs. WebRTC)</b><br/>
    Decision: HLS as primary with DASH fallback<br/>
    Rationale: HLS supports 95%+ devices, DASH provides superior ABR algorithm, WebRTC for live events<br/>
    <br/>
    
    <b>ADR-003: Database (PostgreSQL vs. Cassandra)</b><br/>
    Decision: PostgreSQL 15 with Redis caching layer<br/>
    Rationale: ACID transactions needed for consistency, Redis caches hot data for performance<br/>
    <br/>
    
    <b>ADR-004: Transcoding (Serverless vs. On-Premise)</b><br/>
    Decision: AWS Elemental MediaConvert with fallback to FFmpeg cluster<br/>
    Rationale: Managed service eliminates operational burden, auto-scaling with demand<br/>
    <br/>
    
    <b>ADR-005: CDN Strategy (Single vs. Multi-CDN)</b><br/>
    Decision: Multi-CDN active-active with Cloudflare and Akamai<br/>
    Rationale: 99.99%+ availability through redundancy, 20-30% cost savings through negotiation<br/>
    <br/>
    
    <b>ADR-006: Caching Strategy (Multi-Layer)</b><br/>
    Decision: 3-layer caching (HTTP/Application/Database)<br/>
    Rationale: Sub-100ms latency for frequently accessed content, 80-90% database load reduction
    """
    story.append(Paragraph(adr_text, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # Technical Constraints
    story.append(Paragraph("Technical Constraints & Solutions", styles['Heading1']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("1. Data Sovereignty & Compliance (GDPR/CCPA)", styles['Heading2']))
    constraint1 = """
    <b>Challenge:</b> StreamFlow operates globally but must comply with regional data residency laws.<br/><br/>
    <b>Solution:</b> Regional data centers (North America, Europe, APAC, LatAm) with user data routed 
    to their respective region. Cross-region replication is read-only. GDPR/CCPA features include 
    data export, deletion, consent management, and immutable audit logging. All PII encrypted at rest (AES-256).
    """
    story.append(Paragraph(constraint1, styles['Normal']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("2. Cost Optimization - Egress Bandwidth", styles['Heading2']))
    constraint2 = """
    <b>Challenge:</b> CDN egress costs represent 30-40% of platform expenses. At 100,000 concurrent 
    viewers, monthly egress exceeds 1,000 PB at $0.02/GB standard rates.<br/><br/>
    <b>Solution:</b> Multi-CDN negotiated rates ($0.0144/GB = 28% savings). Modern codec strategy 
    (VP9/AV1) provides 42-58% bitrate reduction. Regional edge caching and ISP partnerships 
    reduce origin egress by 95%. Estimated annual savings: $6.7M at scale.
    """
    story.append(Paragraph(constraint2, styles['Normal']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("3. Adaptive Bitrate (ABR) Streaming", styles['Heading2']))
    constraint3 = """
    <b>Challenge:</b> StreamFlow serves users with vastly different network conditions 
    (1 Mbps rural to 100+ Mbps home broadband).<br/><br/>
    <b>Solution:</b> Intelligent ABR algorithm monitors network bandwidth, latency, and buffer 
    levels in real-time. Starts at conservative quality (480p) and gradually adapts. Smooth 
    transitions minimize quality switches. Target: &lt; 0.1% buffering with 95%+ completion rates.
    """
    story.append(Paragraph(constraint3, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # Implementation Roadmap
    story.append(Paragraph("Implementation Roadmap", styles['Heading1']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Phase 1: MVP (Months 1-3)", styles['Heading2']))
    phase1 = """
    <b>Goal:</b> Launch basic VoD platform with single region<br/>
    <b>Team:</b> 5 backend, 2 frontend, 1 DevOps, 1 QA engineers<br/>
    <b>Deliverables:</b> Upload API, H.264 transcoding (480p/720p), HLS streaming, PostgreSQL metadata, Authentication<br/>
    <b>Infrastructure:</b> Single AWS region, T3 instances, RDS single instance, ElastiCache (1GB)<br/>
    <b>Target Users:</b> 1,000 concurrent | <b>Uptime:</b> 99.9% | <b>Start-to-Play:</b> &lt; 3s
    """
    story.append(Paragraph(phase1, styles['Normal']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Phase 2: Scale & Global (Months 4-6)", styles['Heading2']))
    phase2 = """
    <b>Goal:</b> Multi-region deployment with multi-CDN<br/>
    <b>Team:</b> 8 backend, 3 frontend, 2 DevOps, 3 QA engineers<br/>
    <b>Deliverables:</b> Multi-bitrate (480p-2160p), DASH support, Multi-region DB, Multi-CDN, DRM<br/>
    <b>Infrastructure:</b> 3 AWS regions, Auto-scaling, RDS read replicas, Redis cluster<br/>
    <b>Target Users:</b> 100,000 concurrent | <b>Uptime:</b> 99.95% | <b>Egress Cost:</b> &lt;$0.015/GB
    """
    story.append(Paragraph(phase2, styles['Normal']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Phase 3: Optimization & Features (Months 7-12)", styles['Heading2']))
    phase3 = """
    <b>Goal:</b> Premium features, advanced ABR, cost optimization<br/>
    <b>Team:</b> 12 backend, 5 frontend, 3 DevOps, 1 ML, 5 QA engineers<br/>
    <b>Deliverables:</b> VP9/AV1 codecs, Offline download, Advanced ABR, FFmpeg cluster, Live streaming<br/>
    <b>Infrastructure:</b> GPU instances, Kubernetes, ElastiCache multi-region, S3 Multi-Region Access<br/>
    <b>Target Users:</b> 1M concurrent | <b>Uptime:</b> 99.99% | <b>Egress Cost:</b> &lt;$0.012/GB
    """
    story.append(Paragraph(phase3, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # KPIs
    story.append(Paragraph("Key Performance Indicators (KPIs)", styles['Heading1']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Operational KPIs", styles['Heading2']))
    kpi_ops = """
    <b>Availability:</b> Platform uptime: 99.95% | API response time (P95): &lt; 200ms<br/>
    <b>Performance:</b> Time-to-first-frame: &lt; 2s | Buffering: &lt; 0.1% | Cache hit: &gt; 95%<br/>
    <b>Scalability:</b> Concurrent: 100,000+ | DAU: 10M | Requests/sec: 100,000+<br/>
    <b>Cost:</b> Egress: &lt;$0.012/GB | Storage: &lt;$20/TB | Transcoding: &lt;$1/video
    """
    story.append(Paragraph(kpi_ops, styles['Normal']))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Business KPIs", styles['Heading2']))
    kpi_biz = """
    <b>Engagement:</b> Completion rate: &gt; 60% | Session duration: 45 min | Returning users: 70%<br/>
    <b>Monetization:</b> Revenue/user: $5-15/month | Ad CPM: $2-5 | ARPU: $8-20<br/>
    <b>Quality:</b> NPS: &gt; 50 | CSAT: &gt; 85% | Support resolution: &lt; 24hrs
    """
    story.append(Paragraph(kpi_biz, styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # Conclusion
    story.append(Paragraph("Conclusion", styles['Heading1']))
    story.append(Spacer(1, 0.15*inch))
    
    conclusion = """
    StreamFlow's architecture is designed to be a world-class Video on Demand platform that 
    balances scalability, reliability, performance, and cost efficiency. By implementing 
    industry-standard practices such as multi-region deployment, multi-CDN strategy, intelligent 
    caching, and adaptive bitrate streaming, StreamFlow will deliver an exceptional viewing 
    experience to millions of users globally.<br/><br/>
    
    The three-phase implementation roadmap provides a realistic path to scale from MVP to 
    hyperscale platform. Each phase includes detailed deliverables, team composition, and 
    success metrics. Architectural decisions are documented through ADRs, ensuring all 
    technology choices are justified and traceable.<br/><br/>
    
    Continuous monitoring of KPIs and user feedback will guide optimization efforts. The 
    platform's modular architecture enables independent scaling of components and supports 
    future features such as live streaming, offline download, and machine learning-powered recommendations.
    """
    story.append(Paragraph(conclusion, styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    story.append(PageBreak())
    
    # Document Control
    story.append(Paragraph("Document Control", styles['Heading1']))
    story.append(Spacer(1, 0.15*inch))
    
    doc_control = """
    <b>Document ID:</b> STREAMFLOW-ARCH-001<br/>
    <b>Version:</b> 1.0<br/>
    <b>Status:</b> APPROVED<br/>
    <b>Last Updated:</b> May 25, 2026<br/>
    <b>Next Review:</b> November 25, 2026<br/>
    <b>Owner:</b> Lead Architect, StreamFlow<br/>
    <b>Reviewers:</b> CTO, VP Engineering, Principal Architects<br/>
    <b>Approver:</b> Chief Technology Officer<br/>
    <br/>
    <i>© 2026 StreamFlow. All Rights Reserved.</i>
    """
    story.append(Paragraph(doc_control, styles['Normal']))
    
    # Build PDF
    doc.build(story)
    print(f"✓ PDF successfully generated: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    create_pdf()
