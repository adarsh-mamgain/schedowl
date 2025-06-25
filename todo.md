## Todo

- billing to default trial plan
- create gemini api key from kanika's google account
- create org button
- approve member/admin requirement

- payment webhook complete
- allow organisation to be created by owner
- allow organisation switch
- allow the members to accept the scheduled posts
- put account billing type restrictions
- allow editing the post by clicking on the post

- Google Signin and emailing for signup
- dodopayments webhook and features validator

  - cancel the next subscription only
  - see past payments and invoices
  - allow upgrading and downgrading (careful)

- add members and switch organisation
- please allow to editing any post using the PostModal and create all the respective apis if not present (from the Calendar).
- allow drafting a post by clicking on 'Draft' button
- The scheduling button and selecting time should be much better UX/UI.
- also show the preview of the media inside the Sidebar Preview like the LinkedIn post.

- company page scheduling
- input field, buttons colors
- forgot password
- allow PDF for media
- remove unwanted UIs while loading
- change the LinkedIn product APIs

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
