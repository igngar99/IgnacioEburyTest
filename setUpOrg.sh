#!/bin/bash

# Alias for the scratch org
ORG_ALIAS="TestOrg"

# Set variables
PACKAGE_NAME="MiApp" # Name of the package or app to install

#  Authenticate to Salesforce (if not already authenticated)
echo "Authenticating to Salesforce..."
sfdx auth:web:login --setalias DevHub

# Create a new scratch org
echo "Creating a new scratch org with alias $ORG_ALIAS..."
sfdx force:org:create -s -f config/project-scratch-def.json -a $ORG_ALIAS

# Push metadata to the scratch org
echo "Deploying metadata to the org..."
sfdx force:source:push -u $ORG_ALIAS

# Assign necessary permissions
echo "Assigning permissions..."
sfdx force:user:permset:assign -n $PACKAGE_NAME

# Open the org in the browser
echo "Opening the org in the browser..."
sfdx force:org:open -u $ORG_ALIAS

echo "Setup complete."
