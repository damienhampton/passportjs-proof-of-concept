const { google } = require('googleapis');

module.exports = (config) => {
  async function listUsers(){
    const auth = new google.auth.GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/admin.directory.user',
        // 'https://www.googleapis.com/auth/admin.directory.rolemanagement',
        // 'https://www.googleapis.com/auth/youtube.readonly'
      ],
      subject: 'damien@26brains.com'
    });

    const authClient = await auth.getClient();
    const project = await auth.getProjectId();

    const customer = 'C01ihesdh';
    // const domain = '26brains.com';
    const adminService = google.admin({ version: 'directory_v1', auth });
    await adminService.users.list({ customer });

    // const youtubeService = google.youtube('v3');
    // const ytRes = await youtubeService.channels.list({
    //   auth: auth,
    //   part: 'snippet,contentDetails,statistics',
    //   forUsername: 'GoogleDevelopers'
    // });
    // console.log(ytRes.data.items);
  }

  return {
    listUsers
  }
}