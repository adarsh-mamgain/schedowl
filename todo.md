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
