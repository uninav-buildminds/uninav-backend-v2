Aside from readme, i want you to create "copilot_custom_instructions.md" this is a file as you know used for to provide extra context and instruction to copilot about the project and practices it should follow for code generation.
Make the instruction concise so it can process it quickly, but it should capture the essense of my project , the all the sections and logic of my application, and any useful tip you can suggest based on our discussion so far.

Include things like:
**Maintain Clean, Modular Code**: Keep functions and components small, reusable, and well-documented, I use camel case for every project
I use axios, always handle errors gracefully

It could look something like this, in this structure(note this doesn't have anything to do with this project ):

# GoalFund - Transparent Contribution & Fund Management

## Project Overview

GoalFund is a web-based application for community-based financial contributions. It enables organizers to create goals, manage deposits via a virtual account, and ensure transparency through proof verification.

## Key Features

- **Virtual Account Deposits:** Contributors deposit via a shared portal link.
- **Proof of Accomplishment:** Withdrawals require proof, reviewed by contributors.
- **Confirmation System:** Contributors confirm proof legitimacy (thresholds apply).
- **Expected Participant Tracking:** For closed contributions, track expected vs. actual deposits.

## Technical Overview

- Backend: NestJS API, PostgreSQL database.
- Frontend: React application.
- Payments: Squad API, GTBank Virtual Account.
- Proof Storage: Cloudinary.
- Real-time updates: Socket.io

## Important Considerations

- Deposits require name and email.
- Withdrawals require confirmed proof.
- The current location is Nigeria.

This project Users Drizzle ORM
