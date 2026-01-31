import { query } from './index.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const adminResult = await query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO UPDATE SET name = $3
       RETURNING id`,
      ['admin@getclarity.ai', adminPasswordHash, 'Admin User', 'admin']
    );
    const adminId = adminResult.rows[0].id;
    console.log('✅ Admin user created');

    // Create employee user
    const employeePasswordHash = await bcrypt.hash('employee123', 10);
    await query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      ['employee@getclarity.ai', employeePasswordHash, 'Team Member', 'employee']
    );
    console.log('✅ Employee user created');

    // Create Deel (Customer)
    const deelResult = await query(
      `INSERT INTO companies (name, type, website, industry, employee_count, description, status, primary_contact_name, primary_contact_email, primary_contact_title, contract_value, contract_start_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        'Deel',
        'customer',
        'https://www.deel.com',
        'HR Technology / Fintech',
        '3,000+',
        'Deel is the all-in-one HR platform for global teams. It helps companies simplify every aspect of managing an international workforce, from culture and onboarding, to local payroll and compliance.',
        'active',
        'Alex Bouaziz',
        'alex@deel.com',
        'CEO & Co-founder',
        250000.00,
        '2025-01-15',
        'Strategic enterprise customer. Very engaged with our platform. Key use case: AI-powered customer insights for their global HR operations.'
      ]
    );
    
    let deelId: string;
    if (deelResult.rows.length > 0) {
      deelId = deelResult.rows[0].id;
    } else {
      const existingDeel = await query(`SELECT id FROM companies WHERE name = 'Deel'`);
      deelId = existingDeel.rows[0].id;
    }
    console.log('✅ Deel (customer) created');

    // Create Robinhood (Prospect)
    const robinhoodResult = await query(
      `INSERT INTO companies (name, type, website, industry, employee_count, description, status, primary_contact_name, primary_contact_email, primary_contact_title, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        'Robinhood',
        'prospect',
        'https://www.robinhood.com',
        'Fintech / Financial Services',
        '3,800+',
        'Robinhood Markets, Inc. is an American financial services company headquartered in Menlo Park, California. The company offers a mobile app and website that allows people to invest in stocks, ETFs, options, and cryptocurrencies.',
        'active',
        'Sarah Chen',
        'sarah.chen@robinhood.com',
        'VP of Engineering',
        'High-potential enterprise prospect. Interested in our AI analytics capabilities for customer behavior insights. Initial discovery call scheduled.'
      ]
    );

    let robinhoodId: string;
    if (robinhoodResult.rows.length > 0) {
      robinhoodId = robinhoodResult.rows[0].id;
    } else {
      const existingRobinhood = await query(`SELECT id FROM companies WHERE name = 'Robinhood'`);
      robinhoodId = existingRobinhood.rows[0].id;
    }
    console.log('✅ Robinhood (prospect) created');

    // Add sample transcript for Deel
    await query(
      `INSERT INTO transcripts (company_id, title, meeting_date, duration_minutes, participants, content, summary, key_points, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT DO NOTHING`,
      [
        deelId,
        'Deel Kickoff Call - January 2025',
        '2025-01-15 10:00:00',
        45,
        ['Alex Bouaziz (Deel CEO)', 'Maria Santos (Deel Product)', 'Michael (Clarity.ai)', 'Sarah (Clarity.ai)'],
        `Meeting Transcript - Deel Kickoff Call

Michael: Good morning everyone! Thanks for joining us today. Alex, Maria, it's great to finally connect.

Alex: Thanks Michael, we've been looking forward to this. Deel has been growing rapidly and we need better tools to understand our customers at scale.

Michael: Absolutely. Can you tell us more about the challenges you're facing?

Maria: Sure. We have over 15,000 customers globally now. Our CS team is struggling to keep up with understanding each customer's unique needs. We have data scattered across Salesforce, Zendesk, our product analytics, and various documents.

Alex: The biggest pain point is when someone asks "what does Customer X need?" - it takes hours of research to piece together the full picture. We need something that can instantly give us context.

Michael: That's exactly what Clarity.ai solves. Our platform aggregates all your customer data and uses AI to provide instant, evidence-based insights.

Maria: How does the AI know which information is most relevant?

Sarah: Great question. Our AI is trained to understand customer context. When you ask a question, it searches through all available data - emails, meeting notes, support tickets, product usage - and synthesizes an answer with citations.

Alex: Can it identify patterns across customers? Like, are there common requests from our enterprise segment?

Michael: Absolutely. The analytics dashboard shows trends across your customer base. You can filter by segment, industry, company size, and more.

Alex: This sounds exactly like what we need. What's the implementation timeline?

Michael: Typically 2-3 weeks for full deployment. We'll start with data integration, then train the AI on your specific terminology and context.

Maria: What about security? Our customer data is sensitive.

Sarah: We're SOC 2 Type II certified and all data is encrypted at rest and in transit. We can also deploy in your VPC if needed.

Alex: Perfect. Let's move forward. Maria will be the main point of contact on our side.

Michael: Excellent! We'll send over the contract and technical requirements today.`,
        'Kickoff call with Deel to discuss their customer intelligence needs. They have 15,000+ customers globally and need better tools to understand customer needs at scale. Main pain points: scattered data across multiple systems, time-consuming research to understand customers. Agreed to move forward with implementation.',
        [
          'Deel has 15,000+ customers globally',
          'Pain point: data scattered across Salesforce, Zendesk, product analytics',
          'Need instant, evidence-based customer insights',
          'Interested in cross-customer pattern analysis',
          'Security requirements: SOC 2, encryption, possible VPC deployment',
          'Implementation timeline: 2-3 weeks',
          'Maria Santos is main POC'
        ],
        adminId
      ]
    );
    console.log('✅ Sample transcript for Deel created');

    // Add sample email for Deel
    await query(
      `INSERT INTO emails (company_id, subject, from_address, to_addresses, sent_date, body, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [
        deelId,
        'Re: Clarity.ai Implementation - Next Steps',
        'maria@deel.com',
        ['michael@getclarity.ai', 'sarah@getclarity.ai'],
        '2025-01-16 14:30:00',
        `Hi Michael and Sarah,

Thank you for the great kickoff call yesterday! The team is excited to get started with Clarity.ai.

A few follow-up items from our side:

1. Data Integration: I've looped in our data engineering team (cc'd Jake) to start preparing the API access for Salesforce and Zendesk. They should have credentials ready by EOW.

2. Security Review: Our InfoSec team will need to complete their vendor assessment. I've attached our security questionnaire - would appreciate if you could fill this out by next week.

3. Training Data: We'd like to prioritize our Enterprise segment (companies >1000 employees) for the initial rollout. This represents about 500 of our customers but 60% of our ARR.

4. Success Metrics: Alex wants to track the following KPIs:
   - Time to customer insight (currently ~2 hours, target <5 minutes)
   - CS team satisfaction with tooling
   - Customer health score accuracy

Can we schedule a technical deep-dive with your engineering team for early next week?

Best,
Maria

--
Maria Santos
Head of Product
Deel
maria@deel.com`,
        adminId
      ]
    );
    console.log('✅ Sample email for Deel created');

    // Add sample transcript for Robinhood
    await query(
      `INSERT INTO transcripts (company_id, title, meeting_date, duration_minutes, participants, content, summary, key_points, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT DO NOTHING`,
      [
        robinhoodId,
        'Robinhood Discovery Call - January 2025',
        '2025-01-20 15:00:00',
        30,
        ['Sarah Chen (Robinhood VP Eng)', 'James Liu (Robinhood Data Science)', 'Michael (Clarity.ai)'],
        `Meeting Transcript - Robinhood Discovery Call

Michael: Hi Sarah, James, thanks for taking the time to meet today.

Sarah: Of course! We've heard good things about Clarity.ai from the team at Deel actually.

Michael: Oh that's great to hear! How do you know the Deel team?

Sarah: Alex and I were in the same YC batch years ago. He mentioned you're helping them with customer intelligence.

Michael: Yes, we just kicked off with them last week. What brings Robinhood to explore similar solutions?

James: We have a unique challenge. Our customer base is massive - over 20 million users. Obviously we can't have individual relationships with retail users, but we have about 500 enterprise and institutional clients that we need to understand deeply.

Sarah: Our institutional business is growing fast. These are hedge funds, RIAs, and fintech companies using our APIs. They have complex needs and long sales cycles.

Michael: I see. So you need better visibility into these high-value relationships?

James: Exactly. Right now our enterprise team uses a combination of Notion docs, Slack channels, and memory. It's not scalable.

Sarah: We're also interested in the AI angle. Can your platform help us predict which prospects are most likely to convert?

Michael: Absolutely. Our AI can analyze patterns in your successful deals and score prospects accordingly. It can also identify at-risk customers before they churn.

James: What about compliance? We're heavily regulated by FINRA and SEC.

Michael: We work with several financial services companies. Our platform supports audit logging, data retention policies, and role-based access control. We can restrict who sees what data.

Sarah: That's important. Can you send over some case studies from financial services clients?

Michael: Will do. I'll also include our security documentation and compliance certifications.

Sarah: Great. Let's schedule a demo with our broader team - probably 5-6 people from enterprise sales, data, and compliance.

Michael: Perfect. I'll send some times for next week.`,
        'Discovery call with Robinhood. Referred by Alex at Deel. Robinhood has 20M+ retail users but focused on 500 enterprise/institutional clients (hedge funds, RIAs, fintech). Current tools: Notion, Slack, memory - not scalable. Interested in AI for prospect scoring and churn prediction. Compliance is key concern (FINRA, SEC). Next step: demo with broader team.',
        [
          'Referred by Alex Bouaziz from Deel (YC connection)',
          '20M+ retail users, 500 enterprise/institutional clients',
          'Enterprise clients: hedge funds, RIAs, fintech companies using APIs',
          'Current tools: Notion, Slack, tribal knowledge - not scalable',
          'Interest in AI for prospect scoring and churn prediction',
          'Heavy compliance requirements: FINRA, SEC regulated',
          'Need audit logging, data retention, RBAC',
          'Next step: demo with 5-6 stakeholders'
        ],
        adminId
      ]
    );
    console.log('✅ Sample transcript for Robinhood created');

    // Add sample document for Robinhood
    await query(
      `INSERT INTO documents (company_id, title, type, content, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [
        robinhoodId,
        'Robinhood - Proposal Draft v1',
        'proposal',
        `CLARITY.AI PROPOSAL FOR ROBINHOOD MARKETS

Executive Summary
-----------------
Clarity.ai proposes to implement our Customer Intelligence Platform for Robinhood's enterprise sales and customer success teams. This solution will provide AI-powered insights into your 500+ institutional clients, enabling faster deal cycles, improved customer retention, and data-driven decision making.

Proposed Solution
-----------------
1. Data Integration Layer
   - Connect to Salesforce CRM
   - Integrate with internal APIs
   - Email archive ingestion
   - Meeting transcript processing

2. AI-Powered Intelligence
   - Natural language queries about any customer
   - Automatic summarization of customer interactions
   - Prospect scoring based on conversion patterns
   - Churn risk prediction and alerts

3. Compliance & Security
   - SOC 2 Type II certified
   - FINRA-compliant audit logging
   - Role-based access control
   - Data encryption at rest and in transit
   - Option for VPC deployment

Investment
----------
Annual Platform License: $180,000
Implementation Services: $25,000
Total Year 1 Investment: $205,000

Timeline
--------
Week 1-2: Data integration and security review
Week 3-4: AI model training on Robinhood data
Week 5-6: User acceptance testing
Week 7: Production deployment and training

Expected ROI
------------
- 50% reduction in time-to-insight for enterprise team
- 20% improvement in prospect conversion rate
- 15% reduction in enterprise churn
- Estimated value: $500K+ annually

Next Steps
----------
1. Technical deep-dive with data engineering
2. Security and compliance review
3. Stakeholder demo
4. Contract negotiation`,
        adminId
      ]
    );
    console.log('✅ Sample proposal for Robinhood created');

    // Create some tags
    await query(
      `INSERT INTO tags (name, color) VALUES 
       ('Enterprise', '#6366f1'),
       ('High Priority', '#ef4444'),
       ('Fintech', '#10b981'),
       ('HR Tech', '#f59e0b'),
       ('Active Deal', '#3b82f6')
       ON CONFLICT (name) DO NOTHING`
    );
    console.log('✅ Tags created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Default credentials:');
    console.log('   Admin: admin@getclarity.ai / admin123');
    console.log('   Employee: employee@getclarity.ai / employee123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
