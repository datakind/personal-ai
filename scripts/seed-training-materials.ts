import { db } from '@/db';
import { trainingMaterials } from '@/db/schema';

const demoMaterials = [
  {
    title: 'PHQ-9 Depression Screening',
    categoryId: 'phq9',
    content: `The Patient Health Questionnaire-9 (PHQ-9) is a validated screening tool for depression. 

Key Points:
- 9-item self-report questionnaire
- Scores range from 0-27
- Scoring: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 moderately severe, 20-27 severe depression
- Can be used for initial diagnosis and monitoring treatment response
- Question 9 assesses suicidal ideation and requires immediate follow-up if endorsed

Administration:
- Takes 2-3 minutes to complete
- Can be self-administered or clinician-administered
- Should be repeated at regular intervals to track progress

Clinical Application:
- Use as part of comprehensive assessment, not standalone diagnosis
- Consider cultural and linguistic factors
- Document scores and clinical interpretation in patient record`,
  },
  {
    title: 'HIPAA Privacy and Security Fundamentals',
    categoryId: 'compliance',
    content: `Understanding HIPAA requirements is essential for all healthcare professionals handling protected health information (PHI).

Core Principles:
- Privacy Rule: Protects patient health information
- Security Rule: Safeguards electronic PHI (ePHI)
- Breach Notification Rule: Requires notification of unauthorized access

Protected Health Information (PHI):
- Any individually identifiable health information
- Includes: names, dates, addresses, SSN, medical records, payment information
- Applies to past, present, or future health conditions

Minimum Necessary Standard:
- Only access PHI needed for your job function
- Limit disclosures to minimum necessary
- Apply to all uses except treatment purposes

Patient Rights:
- Right to access their records
- Right to request amendments
- Right to accounting of disclosures
- Right to request restrictions

Violations and Penalties:
- Civil penalties: $100-$50,000 per violation
- Criminal penalties: Up to $250,000 and 10 years imprisonment
- Report suspected breaches immediately to compliance officer`,
  },
  {
    title: 'Medication Administration: The Five Rights',
    categoryId: 'medication-safety',
    content: `The Five Rights of medication administration are fundamental safety principles that prevent medication errors.

The Five Rights:

1. Right Patient
   - Verify patient identity using two identifiers
   - Check wristband and ask patient to state name and DOB
   - Never rely on room number alone

2. Right Medication
   - Compare medication label to order three times
   - Check before removing from storage, before preparation, before administration
   - Verify medication name and formulation

3. Right Dose
   - Calculate dose carefully, double-check calculations
   - Use standardized measurement tools
   - Question orders that seem unusual

4. Right Route
   - Confirm route matches order (oral, IV, IM, subcutaneous, etc.)
   - Ensure patient can receive via ordered route
   - Never assume route if not specified

5. Right Time
   - Administer within 30-60 minutes of scheduled time
   - Consider medication interactions and timing requirements
   - Document administration time accurately

Additional Considerations:
- Right documentation: Record immediately after administration
- Right to refuse: Patients can decline medication
- Right reason: Understand why medication is prescribed
- Right response: Monitor for therapeutic effect and adverse reactions

Error Prevention:
- Never administer medications prepared by others
- Avoid distractions during preparation and administration
- Report near-misses and errors through proper channels`,
  },
  {
    title: 'Hand Hygiene and Infection Control',
    categoryId: 'infection-control',
    content: `Proper hand hygiene is the single most effective way to prevent healthcare-associated infections (HAIs).

When to Perform Hand Hygiene:
- Before patient contact
- Before aseptic/clean procedures
- After body fluid exposure risk
- After patient contact
- After contact with patient surroundings

Hand Washing vs. Hand Sanitizer:

Use Soap and Water When:
- Hands are visibly soiled
- After caring for patients with C. difficile
- After using the restroom
- Before eating

Use Alcohol-Based Hand Sanitizer When:
- Hands are not visibly soiled
- Before and after most patient contact
- After removing gloves
- More effective than soap for most pathogens

Proper Hand Washing Technique:
1. Wet hands with warm water
2. Apply soap and lather for 20 seconds
3. Scrub all surfaces: palms, backs, between fingers, under nails
4. Rinse thoroughly
5. Dry with disposable towel
6. Use towel to turn off faucet

Hand Sanitizer Technique:
1. Apply product to palm (3-5 mL)
2. Rub hands together covering all surfaces
3. Continue until hands are dry (20 seconds)

Personal Protective Equipment (PPE):
- Gloves do not replace hand hygiene
- Perform hand hygiene before donning and after removing gloves
- Change gloves between patients and between dirty and clean tasks

Impact:
- Reduces HAIs by up to 50%
- Protects healthcare workers from infection
- Demonstrates professionalism and patient safety commitment`,
  },
  {
    title: 'Recognizing and Responding to Clinical Deterioration',
    categoryId: 'emergency-response',
    content: `Early recognition of patient deterioration can prevent adverse outcomes and save lives.

Warning Signs of Deterioration:

Respiratory:
- Respiratory rate <8 or >24 breaths/minute
- New oxygen requirement or increased O2 needs
- Difficulty speaking in full sentences
- Use of accessory muscles

Cardiovascular:
- Heart rate <50 or >120 bpm
- Systolic BP <90 or >180 mmHg
- New chest pain or pressure
- Decreased urine output (<0.5 mL/kg/hr)

Neurological:
- Decreased level of consciousness
- New confusion or agitation
- Unequal pupils or focal weakness
- Severe headache

Other Red Flags:
- Temperature >38.5°C or <36°C
- Uncontrolled pain
- Patient or family expressing concern
- "Gut feeling" that something is wrong

Rapid Response Activation:
- Know your facility's activation criteria
- Call early - don't wait for multiple criteria
- Stay with patient until help arrives
- Prepare to give SBAR report

SBAR Communication:
- Situation: "I'm calling about [patient name] who is experiencing [problem]"
- Background: Brief relevant history, vital signs, recent changes
- Assessment: Your clinical impression
- Recommendation: What you think should be done

Immediate Actions While Waiting:
- Position patient appropriately (elevate head for respiratory distress)
- Ensure IV access
- Apply oxygen if indicated
- Obtain vital signs
- Gather medication list and recent labs
- Have chart/EMR available

Documentation:
- Record time of recognition and notification
- Document vital signs and assessment findings
- Note interventions and patient response
- Complete incident report per facility policy

Remember: It's better to call for help early than to wait until a crisis develops.`,
  },
];

async function seedTrainingMaterials() {
  console.log('Seeding training materials...');

  try {
    for (const material of demoMaterials) {
      const [inserted] = await db
        .insert(trainingMaterials)
        .values(material)
        .returning();
      
      console.log(`✓ Created: ${inserted.title} (ID: ${inserted.id})`);
    }

    console.log('\n✅ Successfully seeded 5 training materials');
    console.log('\nCategories created:');
    console.log('  - phq9');
    console.log('  - compliance');
    console.log('  - medication-safety');
    console.log('  - infection-control');
    console.log('  - emergency-response');
  } catch (error) {
    console.error('❌ Error seeding training materials:', error);
    throw error;
  }
}

seedTrainingMaterials()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
