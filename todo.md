## Todo

### - [ ] CronJob worker setup

### - [ ] Automatic migrate dev and deploy

- [x] create DEV, STAGE and PRODUCTION environments
  - [ ] create proper pipelines for each
  - [ ] create todo for every release
- [x] make the login ui
  - [x] create an organisation and super admin (type: 1)
  - [x] superadmin can add other admins (type: 2)
  - [x] admins can add members (type: 3)
  - [x] integrate the Google login
  - [x] integrate the Credentials login
- [x] protect all the api routes and pages
  - [x] jwt/session token
  - [x] csrf token
- [x] integrate linkedin (type: 1)
  - [x] match the state for oauth integration
  - [ ] if error is thrown then handle it to return back to dashboard
- [x] handle refresh tokens for the account
- [ ] allow scheduling the posts (cronjob)
  - add backups to check if the posts are in the queue
  - add exponential retries
  - add error/failure handling through emails
  - store logs for each posts (retries of jsonb)
- [x] build the whole available UI
- [ ] uses Amazon SES for marketing emails

- create hetzner + coolify
  - [x] setup stage account
  - [ ] setup prod account

## Research

- unicode bold
- unicode italics
- unicode bullets
- unicode emojis

# Authorization

Now let's work on adding user roles and permissions to my schedowl project. Go through the whole project and 'THINK HARD'.

There are three roles Owner, Admin and Member.

I have a doc from my CEO stating what all needs to be done.

I have implemented few features please add the authorization to that and later tell me what all features are pending to be built and apply authroization too.

CEO DOC:

# User Roles and Permissions

## **1. Individual Plan (Regular & Pro)**

Since this plan is designed for single users, roles are minimal:

### **User**

- Full access to all features is available based on their subscription (Regular or Pro).
- Can schedule posts, analyze content, use AI tools, and organize drafts.
- Can manage their own content but have no team management capabilities.

## **2. Agency Plan (For Teams & Multi-Account Management)**

This plan introduces multiple roles for agencies and teams.

### **🔹 Super Admin** (Owner of the agency workspace)

- Has **full control** over all workspaces.
- Can **add/remove Admins and Users**.
- Manages **billing, subscription, and permissions**.
- Access to **all AI tools, scheduling, and analytics**.
- Can **approve or reject posts** before publishing (if enabled).
- Can set **content guidelines** for consistency.

### **🔹 Admin** (Team lead or manager)

- Can **manage multiple clients/workspaces** (depending on the plan).
- Can **add, remove, and assign Users** to different workspaces.
- Can **schedule posts, use AI tools, and analyze performance**.
- Can **review and edit posts** before publishing.
- No access to **billing & subscription settings**.

### **🔹 User** (Content creator or social media manager)

- Can **write, edit, and schedule posts** within assigned workspaces.
- Can **use AI-powered tools** for post creation and optimization.
- Can **view analytics** but cannot manage other users.
- Cannot **add or remove members** or **manage billing**.

### **Additional Permissions Based on Plan**

| Feature                           | Super Admin | Admin | User |
| --------------------------------- | ----------- | ----- | ---- |
| Add/remove admins & users         | ✅          | ❌    | ❌   |
| Assign users to workspaces        | ✅          | ✅    | ❌   |
| Approve/reject posts (if enabled) | ✅          | ✅    | ❌   |

| Manage billing & subscription | ✅ | ❌ | ❌ |
| Create, edit, and schedule posts | ✅ | ✅ | ✅ |
| Use AI tools (content generation, analytics) | ✅ | ✅ | ✅ |
| Access advanced analytics | ✅ | ✅ | ❌ |
| Manage multiple accounts (agency model) | ✅ | ✅ | ❌ |
| Set content guidelines | ✅ | ✅ | ❌ |
