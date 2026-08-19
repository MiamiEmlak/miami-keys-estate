# Miami Luxe Foundation

We are starting development of Cays.com, a premium Miami real estate search and lead-generation platform for Cays Realty.

For this first phase, DO NOT build the entire application.

We are building the foundation only.

TECH STACK

Frontend:

- Lovable

- React

- Responsive desktop and mobile design

Backend:

- Supabase

- PostgreSQL

- Supabase Auth

- Supabase Edge Functions

MLS:

- Cotality Trestle OData API

IMPORTANT SECURITY REQUIREMENT:

The Trestle Client ID, Client Secret and Access Token must NEVER be placed in frontend/client-side code.

Trestle authentication and API requests must happen through a Supabase Edge Function.

Trestle credentials will eventually be stored as Supabase secrets/environment variables.

FIRST OBJECTIVE

Create the database architecture and secure backend foundation needed for a real MLS-powered Cays application.

Create these initial database tables:

1. properties

Store normalized MLS property information including:

- listing_key

- listing_id

- standard_status

- list_price

- property_type

- property_sub_type

- street_address

- city

- state

- postal_code

- bedrooms_total

- bathrooms_total

- living_area

- lot_size

- year_built

- tax_annual_amount

- association_fee

- association_fee_frequency

- list_agent_id

- list_office_id

- description

- latitude

- longitude

- original_list_price

- previous_list_price

- modification_timestamp

- listing_contract_date

- close_price

- close_date

- raw MLS data where appropriate

2. property_media

Include:

- media_key

- listing_key

- media_url

- media_type

- media_category

- order_number

- short_description

- modification_timestamp

3. users/profile system

Use Supabase Auth.

Create the necessary profile structure for future lead management.

4. saved_properties

For authenticated users:

- user_id

- listing_key

- created_at

5. property_watches

For future property/building/street monitoring:

- user_id

- watch_type

- watch_value

- listing_key where applicable

- created_at

- active

6. saved_searches

For future alerts:

- user_id

- search_name

- search criteria

- alert_frequency

- active

- created_at

7. leads

Include:

- name

- email

- phone

- source

- lead_type

- status

- created_at

8. lead_activity

Track:

- lead/user

- activity type

- listing_key when applicable

- metadata

- timestamp

DATABASE DESIGN REQUIREMENTS

- Use proper foreign keys where appropriate.

- Add indexes for common MLS searches.

- Do not duplicate unnecessary data.

- Design this so we can later add rental history, price history, comparable properties, ROI calculations, Cays Score and building intelligence.

- Do not invent MLS values.

TRESTLE BACKEND

Create the structure for a Supabase Edge Function called:

trestle-properties

It should eventually:

1. Authenticate with the Trestle token endpoint.

2. Request Property records from the Trestle OData endpoint.

3. Return normalized property data to the application.

4. Never expose the Trestle credentials to the browser.

Do NOT put real credentials into the code.

Create placeholder environment variable names such as:

TRESTLE_BASE_URL

TRESTLE_TOKEN_URL

TRESTLE_CLIENT_ID

TRESTLE_CLIENT_SECRET

Do not hardcode credentials.

ADMIN/TESTING

Create a simple protected testing page that will eventually allow us to test:

- Trestle connection

- Number of properties returned

- First few listing records

- Media availability

Do not build the public search interface yet.

DESIGN

Use a clean premium Cays Realty visual foundation:

- sophisticated

- modern

- Miami luxury real estate

- lots of whitespace

- excellent typography

- responsive

Do not make the application look like a generic Zillow clone.

IMPORTANT:

Before making changes, inspect the existing project and Supabase connection.

At the end, report exactly:

1. Tables created

2. Edge Functions created

3. Pages created

4. Environment variables required

5. Any errors or items requiring my action

Do not proceed to advanced features yet.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/009c61d1-706a-4c0f-99c3-8b1e9b0d05d5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
