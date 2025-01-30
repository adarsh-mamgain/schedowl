### Todo

- [x] create the database schema for org and user
- [x] make the login ui
  - [ ] create an organisation and super admin (type: 1)
  - [ ] superadmin can add other admins (type: 2)
  - [ ] admins can add members (type: 3)
  - [ ] integrate the Google and Credentials login
- [ ] create DEV, STAGE and PRODUCTION environments
  - [ ] create proper pipelines for each
- [x] move this todo as a project to Notion Docs
- [ ] protect all the api routes and pages
  - [ ] jwt/session token
  - [ ] csrf token
- [x] integrate linkedin (type: 1)
  - [ ] match the state for oauth integration
- [ ] handle refresh tokens for the account
- [x] use prisma instead of supabase-js
  - [x] has types to use in whole app
  - [x] allows for proper migrations changes to be created
  - [x] can migrate db to some other infrastructure
  - [ ] handle all db requests as transactions
- [ ] allow posting from the account
- [ ] allow scheduling the posts (cronjob)
  - add backups to check if the posts are in the queue
  - add exponential retries
  - add error/failure handling through emails
  - store logs for each posts (retries of jsonb)
- [ ] build the whole available UI
- [ ] uses Amazon SES for marketing emails

### Research

- unicode bold
- unicode italics
- unicode bullets
- unicode emojis
