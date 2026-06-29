# PLOTHOLE

PlotHole is a social movie tracking and review application built for cinephiles. It lets users browse search watchlist rate review and log movies to a personal diary. It also includes a social feed where users can follow others and track movie activity.

## Tech Stack

Frontend uses React with Vite Tailwind CSS React Router React Query and Lucide Icons.
Backend uses Node with Express JWT bcryptjs database wrapper for SQLite and PostgreSQL.

## How to Install

First clone this repository to your system.

Next run the following commands to install dependencies.

cd backend
npm install

cd ../frontend
npm install

## How to Run

To run the backend server execute this command.

cd backend
npm run dev

To run the frontend client execute this command.

cd frontend
npm run dev

Open http://localhost:5173 in your browser to view the application.

## Production Configuration

Create a file named .env inside the backend folder. Add these lines.

PORT=5000
JWT SECRET=your jwt secret
TMDB API KEY=your tmdb api key
DATABASE URL=your database link

Note that the database wrapper will automatically connect to your live database if the link is present. If it is not present it will use a local database.

## How to Deploy

To deploy the backend you can host the Node server on Render or Railway. Make sure to define the environment variables in their settings.
To deploy the frontend you can host it on Vercel or Netlify. Set the API address variable to point to your live backend.
