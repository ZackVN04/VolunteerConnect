/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "volunteer-connect-infra",
      // Tự động xóa sạch tài nguyên nếu là môi trường dev, giữ lại (retain) nếu là production
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "local",
      providers: {
        gcp: {
          version: "8.3.0", // Bắt buộc phải có version cho các provider ngoài AWS
          project: "volunteer-connect-prod-999", // LƯU Ý: Nếu ID của bạn khác, hãy sửa lại ở đây
        }
      }
    };
  },
  async run() {
    // SST bản mới yêu cầu phải Import thư viện động ở bên trong hàm run()
    const gcp = await import("@pulumi/gcp");

    // Khai báo dịch vụ Cloud Run
    const service = new gcp.cloudrun.Service("BackendService", {
      name: `volunteer-connect-backend-${$app.stage}`,
      location: "asia-southeast1",
      template: {
        spec: {
          serviceAccountName: "cloudrun-runtime-sa@volunteer-connect-prod-999.iam.gserviceaccount.com", // Chạy dưới thân phận Robot này
          containers: [{
            image: "asia-southeast1-docker.pkg.dev/volunteer-connect-prod-999/volunteer-connect-repo/volunteer-connect-api:latest",
            ports: [{ containerPort: 8080 }],
            envs: [
              // LƯU Ý: HÃY ĐỔI ĐƯỜNG LINK NÀY THÀNH LINK MONGODB THẬT CỦA BẠN TRƯỚC KHI DEPLOY
              { name: "MONGODB_URL", value: "mongodb+srv://Admin:Admin123@volunteerconnect.m1vn2y8.mongodb.net/volunteer_connect?appName=VolunteerConnect" },
              { name: "DATABASE_NAME", value: "volunteer_connect" },
              { name: "JWT_SECRET", value: "your_jwt_secret" }
            ],
          }],
        },
      },
    });

    // Cấp quyền Public Access (cho phép tất cả mọi người gọi API)
    new gcp.cloudrun.IamMember("PublicAccess", {
      service: service.name,
      location: service.location,
      role: "roles/run.invoker",
      member: "allUsers",
    });

    // Tự động xuất ra đường link Web sau khi deploy thành công
    return {
      WebsiteURL: service.statuses.apply(s => s?.[0]?.url || "Đang khởi tạo..."),
    };
  },
});
