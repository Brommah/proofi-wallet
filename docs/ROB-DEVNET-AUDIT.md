# ROB Developer Console - DEVNET Audit

**Audit Date:** February 2, 2026  
**URL:** https://rob.dev.cere.io  
**Logged in as:** martijn@cere.io  
**Browser Profile:** clawd  

## Executive Summary

The DEVNET version of ROB Developer Console shows significant differences from the production version, with a focus on "Agent Services" rather than "Data Services". The interface appears to be a different version/iteration of the platform.

## Technical Limitations Encountered

- **Browser Control Issues:** Chrome extension relay conflicts prevented full interactive testing
- **Unable to test:** "Run Wizards" and "Create Service" buttons
- **Limited Navigation:** Could not explore other pages due to browser control limitations

## Main Page: Agent Services

### Overview
- **Page Title:** "Agent Services"
- **Tagline:** "Select an agent service to manage your data sources, pipelines, and applications"
- **Network Connection:** Connected to "Dragon 1"
- **Authentication:** Successfully logged in as martijn@cere.io

### Interface Elements

#### Header
- **ROB Logo:** Standard Cere ROB branding
- **User Account:** martijn@cere.io with profile avatar (M)
- **Network Indicator:** "Connected to Dragon 1" 
- **Logout Button:** Available in top-right

#### Main Content Area
- **Primary Heading:** "Agent Services" (large text)
- **Description Text:** "Select an agent service to manage your data sources, pipelines, and applications"

#### Action Buttons (Right Side)
1. **"Run Wizards"** - Light blue button with play icon
2. **"Create Service"** - Blue primary button with plus icon

#### Existing Services
**Moltbot Service** - Service card showing:
- **Icon:** Database/service icon
- **Name:** "Moltbot Service"
- **Created:** 2 Feb 2026, 01:11
- **Updated:** 2 Feb 2026, 01:11
- **Settings Icon:** Gear icon in top-right of card

## Key Differences from Production (rob.cere.io)

### Terminology Changes
1. **"Agent Services"** vs **"Data Services"** - Major terminology shift
2. Focus on "agent service" management rather than data services

### Interface Differences
1. **Service Cards:** Devnet shows individual service cards (Moltbot Service) vs production's approach
2. **Action Buttons:** "Run Wizards" is a prominent feature not seen in production
3. **Network Connection Display:** "Connected to Dragon 1" indicator suggests multi-network support

### Feature Additions (Devnet-Specific)
1. **"Run Wizards" functionality** - Appears to be a guided setup process
2. **Network/Environment Selection** - "Dragon 1" suggests multiple network support
3. **Service Creation Workflow** - Dedicated "Create Service" button

## Areas Requiring Further Investigation

### Unable to Test Due to Technical Limitations:
1. **"Run Wizards" Button Functionality**
   - Purpose and workflow
   - What wizards are available
   - Integration with service creation

2. **"Create Service" Button**
   - Service creation workflow
   - Available templates/options
   - Configuration options

3. **Navigation Structure**
   - Other available pages (Agent Registry, Model Registry)
   - Full site navigation
   - Additional features/sections

4. **Service Management**
   - Clicking into the "Moltbot Service" card
   - Service configuration options
   - Service management capabilities

5. **Network/Environment Management**
   - "Dragon 1" network details
   - Ability to switch networks
   - Network-specific features

## Preliminary Assessment

### Version Comparison
- **Devnet appears newer:** Based on terminology evolution from "Data Services" to "Agent Services"
- **Enhanced UX:** More guided approach with wizards and clearer CTAs
- **Multi-Network Support:** "Dragon 1" suggests infrastructure for multiple networks/environments

### Technical Architecture
- **SPA (Single Page Application):** React/JS-heavy interface requiring full browser rendering
- **Authentication Integration:** Seamless login maintained from main session
- **Network-Aware:** Environment/network switching capabilities

## Recommendations for Complete Audit

1. **Resolve browser control issues** to enable full interactive testing
2. **Test all interactive elements** (buttons, navigation, service management)
3. **Compare complete feature sets** between devnet and production
4. **Document all available pages/sections**
5. **Test service creation and management workflows**
6. **Investigate "Dragon 1" network capabilities**
7. **Explore any admin/registry sections** (Agent Registry, Model Registry)

## Status

**PARTIAL AUDIT COMPLETED** - Visual interface documented, interactive testing blocked by browser control issues.

**Next Steps:** Resolve technical limitations and complete interactive element testing.