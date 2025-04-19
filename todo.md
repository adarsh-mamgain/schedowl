## Todo

- company page scheduling
- ⁠basic analytics in dashboard page
- create the highest prod account setup https://app.schedowl.com

- add ELK
- input field, buttons colors
- forgot password
- ⁠bug fixes
- ⁠billing and restrictions for the product
- allow PDF for media
- remove unwanted UIs while loading

- change the LinkedIn product APIs

  - support@schedowl.com

- create subscriptions (WITH A LOT OF DIALOG BOXES)
  - cancel the next subscription only
  - see past payments and invoices
  - allow upgrading and downgrading (careful)

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
