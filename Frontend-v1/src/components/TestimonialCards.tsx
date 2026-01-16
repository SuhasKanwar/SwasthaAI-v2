import { CardStack } from "@/components/ui/card-stack";;
import { cn } from "@/lib/utils";
export default function TestimonialCards() {
  return (
    <div className="h-[20rem] flex flex-col md:flex-row gap-25 items-center justify-center w-full" id="testimonials">
      <CardStack items={CARDS_1} />
      <CardStack items={CARDS_2} />
      <CardStack items={CARDS_3} />
    </div>
  );
}

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        "font-bold bg-emerald-100 text-emerald-700 px-1 py-0.5",
        className
      )}
    >
      {children}
    </span>
  );
};

const CARDS_1 = [
  {
    id: 0,
    name: "Aarav Sharma",
    designation: "AI Researcher",
    content: (
      <p>
        Building <Highlight>intelligent systems</Highlight> that can assist people
        in their daily lives is my passion. SwasthaAI is a step towards{" "}
        <Highlight>accessible healthcare</Highlight> for all.
      </p>
    ),
  },
  {
    id: 1,
    name: "Priya Verma",
    designation: "Frontend Developer",
    content: (
      <p>
        Crafting <Highlight>beautiful interfaces</Highlight> is what I love. With
        SwasthaAI, we aim to make{" "}
        <Highlight>health information</Highlight> easy to understand and interact
        with.
      </p>
    ),
  },
  {
    id: 2,
    name: "Rahul Mehta",
    designation: "Backend Engineer",
    content: (
      <p>
        Ensuring <Highlight>secure and reliable</Highlight> data handling is
        crucial. Our backend is designed for{" "}
        <Highlight>performance and privacy</Highlight> at every step.
      </p>
    ),
  },
];

const CARDS_2 = [
  {
    id: 3,
    name: "Sneha Kapoor",
    designation: "UX Designer",
    content: (
      <p>
        A <Highlight>user-centric approach</Highlight> drives our design. We
        believe <Highlight>healthcare tools</Highlight> should be intuitive and
        inclusive for everyone.
      </p>
    ),
  },
  {
    id: 4,
    name: "Vikram Singh",
    designation: "DevOps Specialist",
    content: (
      <p>
        <Highlight>Continuous integration</Highlight> and{" "}
        <Highlight>deployment</Highlight> keep SwasthaAI running smoothly.
        Automation helps us deliver{" "}
        <Highlight>features faster</Highlight> to our users.
      </p>
    ),
  },
  {
    id: 5,
    name: "Meera Joshi",
    designation: "Clinical Advisor",
    content: (
      <p>
        Our mission is to provide <Highlight>accurate health guidance</Highlight>.
        With SwasthaAI, we bridge the gap between{" "}
        <Highlight>technology and healthcare</Highlight>.
      </p>
    ),
  },
];

const CARDS_3 = [
  {
    id: 6,
    name: "Rohan Patel",
    designation: "Mobile Developer",
    content: (
      <p>
        Developing <Highlight>cross-platform apps</Highlight> ensures SwasthaAI
        is available to everyone, everywhere. <Highlight>Mobile-first</Highlight>{" "}
        is our mantra.
      </p>
    ),
  },
  {
    id: 7,
    name: "Anjali Rao",
    designation: "Data Scientist",
    content: (
      <p>
        Leveraging <Highlight>data analytics</Highlight> helps us improve user
        experience and deliver <Highlight>personalized insights</Highlight> for
        better health outcomes.
      </p>
    ),
  },
  {
    id: 8,
    name: "Siddharth Jain",
    designation: "Support Lead",
    content: (
      <p>
        Providing <Highlight>timely support</Highlight> is key to user
        satisfaction. We are here to help you make the most of{" "}
        <Highlight>SwasthaAI</Highlight>.
      </p>
    ),
  },
];