# Use an official Node runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/backend

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8089

# Command to run the app
CMD ["node", "index.js"]