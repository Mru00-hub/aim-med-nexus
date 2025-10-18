import { InfoPageLayout } from './InfoPageLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HelpPage() {
  return (
    <InfoPageLayout title="Help Center">
      <p className="text-lg text-muted-foreground mb-8">
        Welcome to the AIMedNet Help Center. Find answers to common questions below. 
        If you can't find what you're looking for, please contact our support team.
      </p>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>What is AIMedNet?</AccordionTrigger>
          <AccordionContent>
            AIMedNet is an exclusive professional ecosystem for healthcare professionals. 
            We provide a secure platform for networking, collaboration in communities (Spaces), 
            career advancement (Jobs), and industry partnerships.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>How do I get my profile verified?</AccordionTrigger>
          <AccordionContent>
            During registration, you will be asked to provide details about your 
            professional qualifications and registration number. Our team reviews these 
            details to ensure the integrity of our community. You will be notified 
            once your verification is complete.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>What are 'Spaces'?</AccordionTrigger>
          <AccordionContent>
            'Spaces' are dedicated forums or communities within AIMedNet focused on 
            specific medical specialties, topics of interest, or professional groups. 
            You can join existing spaces or create new ones to start discussions and share knowledge.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger>How do I report inappropriate content or a user?</AccordionTrigger>
          <AccordionContent>
            If you encounter content that violates our <a href="/info/code-of-conduct" className="text-primary hover:underline">Code of Conduct</a> or 
            a user exhibiting inappropriate behavior, please use the 'Report' button 
            (if available) or contact us directly through our <a href="/info/report" className="text-primary hover:underline">Report Content</a> page.
          </AccordionContent>
        </AccordionItem>
         <AccordionItem value="item-5">
          <AccordionTrigger>I have a partnership idea. How do I submit it?</AccordionTrigger>
          <AccordionContent>
            We welcome collaboration! Please visit our <a href="/partnerships" className="text-primary hover:underline">Partnerships</a> page 
            to learn more about the types of partnerships we offer and to submit your formal proposal.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </InfoPageLayout>
  );
}
