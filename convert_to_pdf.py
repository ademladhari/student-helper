#!/usr/bin/env python3
"""
Convert Markdown to PDF with professional formatting
"""

import os
import sys
from pathlib import Path

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle
    from reportlab.platypus import KeepTogether
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
    import markdown2
except ImportError:
    print("Installing required packages...")
    os.system("pip install reportlab markdown2 -q")
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle
    from reportlab.platypus import KeepTogether
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
    import markdown2


def markdown_to_pdf(markdown_file, pdf_file):
    """Convert markdown file to PDF"""
    
    # Read markdown file
    with open(markdown_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create PDF
    doc = SimpleDocTemplate(
        pdf_file,
        pagesize=A4,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch,
        title="StreamFlow: VoD Architecture Design",
        author="Lead Architect, StreamFlow"
    )
    
    # Define custom styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#1f4788'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading1_style = ParagraphStyle(
        'CustomHeading1',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#1f4788'),
        spaceAfter=10,
        spaceBefore=12,
        fontName='Helvetica-Bold',
        borderColor=colors.HexColor('#1f4788'),
        borderWidth=2,
        borderPadding=8
    )
    
    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=colors.HexColor('#2d5ca8'),
        spaceAfter=8,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    )
    
    heading3_style = ParagraphStyle(
        'CustomHeading3',
        parent=styles['Heading3'],
        fontSize=11,
        textColor=colors.HexColor('#3d6cb8'),
        spaceAfter=6,
        spaceBefore=8,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_JUSTIFY,
        spaceAfter=6,
        leading=14
    )
    
    code_style = ParagraphStyle(
        'CustomCode',
        parent=styles['Normal'],
        fontSize=8,
        fontName='Courier',
        textColor=colors.HexColor('#444444'),
        backColor=colors.HexColor('#f5f5f5'),
        spaceAfter=6,
        leftIndent=12
    )
    
    # Story for document
    story = []
    
    # Add title and metadata
    story.append(Paragraph("StreamFlow: Enterprise VoD Architecture Design", title_style))
    story.append(Spacer(1, 0.2*inch))
    
    metadata = [
        ["Version:", "1.0"],
        ["Date:", "May 25, 2026"],
        ["Status:", "Architecture Approved"],
        ["Platform:", "Video on Demand (VoD) Streaming"]
    ]
    
    metadata_table = Table(metadata, colWidths=[2*inch, 4*inch])
    metadata_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(metadata_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Table of Contents
    story.append(Paragraph("Table of Contents", heading1_style))
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
        "9. Key Performance Indicators (KPIs)"
    ]
    
    for item in toc_items:
        story.append(Paragraph(f"• {item}", normal_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # Executive Summary
    story.append(Paragraph("Executive Summary", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    exec_summary = """
    <b>StreamFlow</b> is an enterprise-grade Video on Demand (VoD) platform designed to deliver high-quality 
    video content to millions of concurrent viewers globally. The architecture prioritizes scalability, 
    reliability, performance, and cost efficiency. The platform aims to serve the growing demand for 
    on-demand video content while maintaining exceptional performance across diverse network conditions 
    and geographic regions.
    """
    story.append(Paragraph(exec_summary, normal_style))
    story.append(Spacer(1, 0.15*inch))
    
    # Key Objectives
    story.append(Paragraph("Key Architectural Objectives", heading2_style))
    objectives = [
        "Scalability: Handle 100,000+ concurrent viewers with automatic scaling",
        "Reliability: 99.95% uptime SLA with multi-region failover",
        "Performance: &lt;2 second start-to-play latency with adaptive bitrate streaming",
        "Cost Efficiency: Optimized egress through multi-CDN strategy",
        "Security: End-to-end encryption, DRM, and compliance (GDPR/CCPA)"
    ]
    
    for objective in objectives:
        story.append(Paragraph(f"• {objective}", normal_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # System Architecture
    story.append(Paragraph("System Architecture", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    arch_intro = """
    The StreamFlow architecture follows a layered approach, separating concerns across 
    ingestion, processing, storage, delivery, and playback tiers. This design enables 
    independent scaling and failure isolation across each component.
    """
    story.append(Paragraph(arch_intro, normal_style))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Core Components", heading2_style))
    story.append(Spacer(1, 0.1*inch))
    
    components = [
        ("Content Ingestion Layer", "Multi-part upload with resume capability, format validation, and async job queuing"),
        ("Processing Layer", "Transcoding service for generating multiple bitrate variants, metadata extraction, and thumbnail generation"),
        ("Storage Layer", "S3 for video content, PostgreSQL for metadata, Redis for sessions, and Blob Storage for thumbnails"),
        ("CDN Layer", "Multi-CDN strategy with Cloudflare and Akamai for global edge delivery"),
        ("API Gateway", "Authentication, rate limiting, request routing, and manifest generation"),
        ("Playback Layer", "Mobile (React Native), Web (React/Vue), and Smart TV clients"),
        ("Analytics Layer", "User behavior tracking, engagement metrics, and performance monitoring")
    ]
    
    for comp_name, comp_desc in components:
        story.append(Paragraph(f"<b>{comp_name}</b>", heading3_style))
        story.append(Paragraph(comp_desc, normal_style))
        story.append(Spacer(1, 0.08*inch))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # Functional Requirements
    story.append(Paragraph("Functional Requirements", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    fr_text = """
    StreamFlow must provide a comprehensive set of features to support content creators, 
    consumers, and administrators. The following core features define the platform's functionality:
    """
    story.append(Paragraph(fr_text, normal_style))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("Core Features", heading2_style))
    
    features = [
        ("FR-001", "Video Upload", "Users can upload videos with automatic format validation and transcoding"),
        ("FR-002", "Multi-Bitrate Playback", "Platform supports adaptive bitrate streaming (480p → 4K)"),
        ("FR-003", "Resume Playback", "Users can resume from the last watched timestamp (within 7 days)"),
        ("FR-004", "Search & Discovery", "Full-text search across video metadata and thumbnails"),
        ("FR-005", "Playlist Management", "Users can create and manage watchlists"),
        ("FR-006", "User Authentication", "Secure authentication with role-based access control (RBAC)"),
        ("FR-007", "DRM & Content Protection", "Widevine/PlayReady DRM for premium content"),
        ("FR-008", "Subtitle Support", "Multi-language subtitle management and delivery"),
        ("FR-009", "Analytics & Insights", "Track user engagement, watch time, and completion rates"),
        ("FR-010", "Social Sharing", "Generate shareable links with preview metadata")
    ]
    
    feature_data = [[f['0'], f['1'], f['2']] for f in features]
    feature_table = Table(feature_data, colWidths=[0.8*inch, 1.5*inch, 3.5*inch])
    feature_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f4788')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f5f5f5')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
    ]))
    
    story.append(feature_table)
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # Non-Functional Requirements
    story.append(Paragraph("Non-Functional Requirements (NFRs)", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    nfr_intro = """
    Non-functional requirements define the system's quality attributes and performance characteristics. 
    StreamFlow must meet stringent requirements across availability, performance, scalability, security, and cost efficiency.
    """
    story.append(Paragraph(nfr_intro, normal_style))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Availability & Reliability", heading2_style))
    story.append(Spacer(1, 0.08*inch))
    
    avail_data = [
        ["Metric", "Target", "Details"],
        ["Uptime SLA", "99.95%", "Maximum 22 minutes downtime per month"],
        ["Recovery Time (RTO)", "< 5 minutes", "Time to recover from regional failure"],
        ["Recovery Point (RPO)", "< 1 minute", "Maximum data loss during incident"],
        ["Service Degradation", "99.9%", "During partial regional outage"]
    ]
    
    avail_table = Table(avail_data, colWidths=[2*inch, 1.5*inch, 2.5*inch])
    avail_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f4788')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
    ]))
    
    story.append(avail_table)
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Performance & Latency", heading2_style))
    story.append(Spacer(1, 0.08*inch))
    
    perf_data = [
        ["Metric", "Target", "Measurement"],
        ["Time-to-First-Frame", "< 2 seconds", "From click to playback start"],
        ["Manifest Generation", "< 100ms", "Server-side generation time"],
        ["API Response Time (P95)", "< 200ms", "95th percentile latency"],
        ["CDN Cache Hit Ratio", "> 95%", "Percentage of edge-cached requests"],
        ["Average Bitrate Start", "720p (3 Mbps)", "Intelligent initial quality selection"]
    ]
    
    perf_table = Table(perf_data, colWidths=[2*inch, 1.5*inch, 2.5*inch])
    perf_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d5ca8')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
    ]))
    
    story.append(perf_table)
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Scalability Requirements", heading2_style))
    story.append(Spacer(1, 0.08*inch))
    
    scale_data = [
        ["Metric", "Target", "Details"],
        ["Concurrent Viewers", "100,000+", "Per content item"],
        ["Daily Active Users", "10 million", "Total platform"],
        ["Auto-Scaling Response", "< 2 minutes", "New instance ready to serve"],
        ["Transcoding Throughput", "1000 videos/day", "Horizontal scaling"]
    ]
    
    scale_table = Table(scale_data, colWidths=[2*inch, 1.5*inch, 2.5*inch])
    scale_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3d6cb8')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
    ]))
    
    story.append(scale_table)
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # Technology Stack Summary
    story.append(Paragraph("Technology Stack", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("Backend Services", heading2_style))
    
    tech_backend = [
        "Runtime: Node.js 20 LTS / Python 3.11",
        "Web Framework: Express.js / FastAPI",
        "Message Queue: RabbitMQ / AWS SQS",
        "Caching Layer: Redis Cluster 7.0",
        "Job Scheduler: Bull Queue / Celery"
    ]
    
    for tech in tech_backend:
        story.append(Paragraph(f"• {tech}", normal_style))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Storage & Databases", heading2_style))
    
    tech_storage = [
        "Video Storage: Amazon S3 / Google Cloud Storage",
        "Object Backup: S3 Cross-Region Replication",
        "User Metadata: PostgreSQL 15 (Primary DB)",
        "Session Store: Redis Cluster",
        "CDN: Multi-CDN (Cloudflare + Akamai)"
    ]
    
    for tech in tech_storage:
        story.append(Paragraph(f"• {tech}", normal_style))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Media Processing", heading2_style))
    
    tech_media = [
        "Transcoding Engine: AWS Elemental MediaConvert / FFmpeg Cluster",
        "Video Codec: H.264, VP9, AV1",
        "Audio Codec: AAC, Opus",
        "Container Format: MP4 (storage), TS (streaming)"
    ]
    
    for tech in tech_media:
        story.append(Paragraph(f"• {tech}", normal_style))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Streaming Protocols", heading2_style))
    
    tech_stream = [
        "Primary: HLS (HTTP Live Streaming) with hls.js",
        "Secondary: DASH (Dynamic Adaptive Streaming) with dash.js",
        "Live Events: WebRTC (sub-second latency)",
        "ABR: Custom adaptive bitrate algorithm"
    ]
    
    for tech in tech_stream:
        story.append(Paragraph(f"• {tech}", normal_style))
    
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("DevOps & Monitoring", heading2_style))
    
    tech_devops = [
        "Orchestration: Kubernetes (EKS / GKE)",
        "Infrastructure: Terraform / CloudFormation",
        "CI/CD: GitHub Actions / GitLab CI",
        "Monitoring: Prometheus + Grafana",
        "Logging: ELK Stack / Splunk",
        "APM: Datadog / New Relic"
    ]
    
    for tech in tech_devops:
        story.append(Paragraph(f"• {tech}", normal_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # ADR Summary
    story.append(Paragraph("Architectural Decision Records (ADRs)", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    adr_intro = """
    All major technology choices are documented through Architectural Decision Records (ADRs) 
    to ensure decisions are based on logic rather than resume-driven development. Each ADR 
    captures the context, decision, rationale, and consequences.
    """
    story.append(Paragraph(adr_intro, normal_style))
    story.append(Spacer(1, 0.15*inch))
    
    adr_summary = [
        ("ADR-001: Storage", "S3 over Block Storage", "Object storage provides 4-5x cost savings, unlimited scalability, and native CDN integration"),
        ("ADR-002: Protocol", "HLS Primary + DASH Fallback", "HLS supports 95%+ of devices; DASH provides superior ABR algorithm"),
        ("ADR-003: Database", "PostgreSQL with Redis Cache", "ACID transactions needed for data consistency; Redis caches hot data for performance"),
        ("ADR-004: Transcoding", "AWS MediaConvert", "Managed service eliminates operational burden; scales automatically with demand"),
        ("ADR-005: CDN Strategy", "Multi-CDN Active-Active", "Redundancy ensures 99.99%+ availability; 20-30% cost savings through rate negotiation"),
        ("ADR-006: Caching", "3-Layer Caching (HTTP/App/DB)", "Multi-layer caching reduces latency to < 100ms; 80-90% database load reduction")
    ]
    
    for adr_name, decision, rationale in adr_summary:
        story.append(Paragraph(f"<b>{adr_name}</b>", heading3_style))
        story.append(Paragraph(f"Decision: {decision}", normal_style))
        story.append(Paragraph(f"Rationale: {rationale}", normal_style))
        story.append(Spacer(1, 0.08*inch))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # Key Constraints & Solutions
    story.append(Paragraph("Technical Constraints & Solutions", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("1. Data Sovereignty & Compliance (GDPR/CCPA)", heading2_style))
    
    constraint1 = """
    <b>Challenge:</b> StreamFlow operates globally but must comply with regional data residency laws.<br/><br/>
    <b>Solution:</b> Regional data centers (North America, Europe, APAC, LatAm) with user data routed 
    to their respective region. Cross-region replication is read-only. GDPR/CCPA features include 
    data export, deletion, consent management, and audit logging. All PII encrypted at rest (AES-256).
    """
    story.append(Paragraph(constraint1, normal_style))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("2. Cost Optimization - Egress Bandwidth", heading2_style))
    
    constraint2 = """
    <b>Challenge:</b> CDN egress costs represent 30-40% of platform expenses. At 100,000 concurrent 
    viewers, monthly egress exceeds 1,000 PB.<br/><br/>
    <b>Solution:</b> Multi-CDN strategy negotiates rates from $0.02/GB down to $0.0144/GB (28% savings). 
    Modern codec strategy (VP9/AV1) provides 42-58% bitrate reduction. Regional edge caching and 
    ISP partnerships further optimize costs. Estimated annual savings: $6.7M at scale.
    """
    story.append(Paragraph(constraint2, normal_style))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("3. Adaptive Bitrate (ABR) Streaming", heading2_style))
    
    constraint3 = """
    <b>Challenge:</b> StreamFlow serves users with vastly different network conditions (1 Mbps rural 
    to 100+ Mbps home broadband).<br/><br/>
    <b>Solution:</b> Intelligent ABR algorithm monitors network bandwidth, latency, and buffer levels 
    in real-time. Starts at conservative quality and gradually adapts. Smooth transitions minimize 
    quality switches. Target: &lt; 0.1% buffering ratio with 95%+ completion rates.
    """
    story.append(Paragraph(constraint3, normal_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # Implementation Roadmap
    story.append(Paragraph("Implementation Roadmap", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("Phase 1: MVP (Months 1-3)", heading2_style))
    
    phase1_data = [
        ["Goal", "Launch basic VoD platform with single region"],
        ["Team", "5 backend, 2 frontend, 1 DevOps, 1 QA engineers"],
        ["Deliverables", "Upload API, H.264 transcoding (480p/720p), HLS streaming, PostgreSQL metadata, Authentication"],
        ["Infrastructure", "Single AWS region, T3 instances, RDS single instance, ElastiCache Redis (1GB)"],
        ["Target Users", "1,000 concurrent users"],
        ["Uptime SLA", "99.9%"],
        ["Start-to-Play", "< 3 seconds"]
    ]
    
    phase1_table = Table(phase1_data, colWidths=[1.5*inch, 4.5*inch])
    phase1_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f4f8')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    
    story.append(phase1_table)
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Phase 2: Scale & Global (Months 4-6)", heading2_style))
    
    phase2_data = [
        ["Goal", "Multi-region deployment with multi-CDN"],
        ["Team", "8 backend, 3 frontend, 2 DevOps, 3 QA engineers"],
        ["Deliverables", "Multi-bitrate (480p-2160p), DASH support, Multi-region DB, Multi-CDN (Akamai+Cloudflare), DRM"],
        ["Infrastructure", "3 AWS regions, Auto-scaling groups (c5), RDS read replicas, Redis cluster"],
        ["Target Users", "100,000 concurrent users"],
        ["Uptime SLA", "99.95%"],
        ["Egress Cost", "< $0.015/GB"]
    ]
    
    phase2_table = Table(phase2_data, colWidths=[1.5*inch, 4.5*inch])
    phase2_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fff4e6')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    
    story.append(phase2_table)
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph("Phase 3: Optimization & Features (Months 7-12)", heading2_style))
    
    phase3_data = [
        ["Goal", "Premium features, advanced ABR, cost optimization"],
        ["Team", "12 backend, 5 frontend, 3 DevOps, 1 ML, 5 QA engineers"],
        ["Deliverables", "VP9/AV1 codecs, Offline download, Advanced ABR, FFmpeg cluster, Live streaming (WebRTC), ML recommendations"],
        ["Infrastructure", "GPU instances, Kubernetes, ElastiCache multi-region, S3 Multi-Region Access Points"],
        ["Target Users", "1 million concurrent users"],
        ["Uptime SLA", "99.99%"],
        ["Egress Cost", "< $0.012/GB"]
    ]
    
    phase3_table = Table(phase3_data, colWidths=[1.5*inch, 4.5*inch])
    phase3_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f8e8')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    
    story.append(phase3_table)
    
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # KPIs
    story.append(Paragraph("Key Performance Indicators (KPIs)", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph("Operational KPIs", heading2_style))
    
    kpi_ops = [
        ("Availability", "Platform uptime: 99.95% | API response time (P95): < 200ms"),
        ("Performance", "Time-to-first-frame: < 2s | Buffering ratio: < 0.1% | Cache hit ratio: > 95%"),
        ("Scalability", "Concurrent viewers: 100,000+ | Daily active users: 10M | Requests/sec: 100,000+"),
        ("Cost Efficiency", "Egress cost: < $0.012/GB | Storage cost: < $20/TB | Transcoding: < $1/video")
    ]
    
    for kpi_category, kpi_values in kpi_ops:
        story.append(Paragraph(f"<b>{kpi_category}:</b> {kpi_values}", normal_style))
        story.append(Spacer(1, 0.08*inch))
    
    story.append(Spacer(1, 0.15*inch))
    story.append(Paragraph("Business KPIs", heading2_style))
    
    kpi_biz = [
        ("Engagement", "Video completion rate: > 60% | Average session: 45 min | Returning users: 70%"),
        ("Monetization", "Revenue per user: $5-15/month | Ad CPM: $2-5 | ARPU: $8-20"),
        ("Quality of Experience", "NPS: > 50 | CSAT: > 85% | Support resolution: < 24hrs | Compatibility: 99%+")
    ]
    
    for kpi_category, kpi_values in kpi_biz:
        story.append(Paragraph(f"<b>{kpi_category}:</b> {kpi_values}", normal_style))
        story.append(Spacer(1, 0.08*inch))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(PageBreak())
    
    # Conclusion
    story.append(Paragraph("Conclusion", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
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
    future features such as live streaming, offline download, and machine learning-powered 
    recommendations.
    """
    story.append(Paragraph(conclusion, normal_style))
    
    story.append(Spacer(1, 0.3*inch))
    
    # Document Control
    story.append(PageBreak())
    story.append(Paragraph("Document Control", heading1_style))
    story.append(Spacer(1, 0.1*inch))
    
    doc_control = [
        ["Document ID", "STREAMFLOW-ARCH-001"],
        ["Version", "1.0"],
        ["Status", "APPROVED"],
        ["Last Updated", "May 25, 2026"],
        ["Next Review", "November 25, 2026"],
        ["Owner", "Lead Architect, StreamFlow"],
        ["Reviewers", "CTO, VP Engineering, Principal Architects"],
        ["Approver", "Chief Technology Officer"]
    ]
    
    doc_table = Table(doc_control, colWidths=[2.5*inch, 3.5*inch])
    doc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8e8e8')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    
    story.append(doc_table)
    
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("© 2026 StreamFlow. All Rights Reserved.", normal_style))
    
    # Build PDF
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"✓ PDF generated successfully: {pdf_file}")


def add_page_number(canvas, doc):
    """Add page numbers to footer"""
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    page_num = canvas.getPageNumber()
    
    text = f"Page {page_num}"
    canvas.drawRightString(7.75*inch, 0.5*inch, text)
    
    # Add footer line
    canvas.setLineWidth(0.5)
    canvas.line(0.75*inch, 0.6*inch, 7.75*inch, 0.6*inch)
    
    canvas.restoreState()


if __name__ == "__main__":
    markdown_file = r"d:\projects\student-helper\StreamFlow_Architecture_Design.md"
    pdf_file = r"d:\projects\student-helper\StreamFlow_Architecture_Design.pdf"
    
    if os.path.exists(markdown_file):
        markdown_to_pdf(markdown_file, pdf_file)
        print(f"✓ PDF file created at: {pdf_file}")
    else:
        print(f"✗ Markdown file not found: {markdown_file}")
        sys.exit(1)
