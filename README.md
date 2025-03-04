# Giant - BigQuery Desktop Client

A desktop client for BigQuery that allows you to:
- Send SQL queries to BigQuery
- View query results in a table format


## Prerequisites

1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Set up application default credentials:
   ```
   gcloud auth application-default login
   ```
3. Set your Google Cloud project:
   ```
   gcloud config set project YOUR_PROJECT_ID
   ```

## Getting Started

### Development Setup

1. Clone the repository: `git clone https://github.com/msh5/giant.git`
2. Navigate to the project directory: `cd giant/giant`
3. Install dependencies: `npm install`
4. Start the development server: `npm run electron:dev`

### Building for Production

1. Build the application: `npm run electron:build`
2. The packaged application will be available in the `dist` directory

## Features

- SQL editor with syntax highlighting
- Table view for query results
- Uses application default credentials for authentication

## Technologies Used

- Electron
- React
- TypeScript
- Tailwind CSS
- Google Cloud BigQuery API
- React Ace (for SQL editor)
