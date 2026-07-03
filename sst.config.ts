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
      metadata: {
        annotations: {
          // Bỏ comment dòng dưới để biến Server thành "ốc đảo" (Chỉ mạng nội bộ VPC mới gọi được, chặn đứng 100% Internet)
          // "run.googleapis.com/ingress": "internal",
        },
      },
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

    // Cấp quyền gọi API (Private Access) độc quyền cho Robot Frontend
    new gcp.cloudrun.IamMember("PrivateAccess", {
      service: service.name,
      location: service.location,
      role: "roles/run.invoker",
      member: "serviceAccount:volunteer-frontend-sa@volunteer-connect-prod-999.iam.gserviceaccount.com",
    });

    // =====================================================================
    // MODULE: CLOUD MONITORING & ALERTING (SRE)
    // =====================================================================
    
    // 1. Kênh Thông Báo (Notification Channel) - Nhận cảnh báo qua Email
    const emailChannel = new gcp.monitoring.NotificationChannel("SRE_Email_Alerts", {
      displayName: "SRE On-call Team",
      type: "email",
      labels: {
        email_address: "vovankhanh937@gmail.com", // LƯU Ý: Đổi thành email thật của bạn
      },
    });

    // 2. Chính sách Báo động (Alert Policy) - Bắt lỗi 5xx
    const error5xxAlert = new gcp.monitoring.AlertPolicy("High_5xx_Error_Rate", {
      displayName: "🚨 CẢNH BÁO: Lỗi 5xx tăng cao trên Cloud Run",
      combiner: "OR",
      conditions: [{
        displayName: "Tỷ lệ lỗi 5xx > 0",
        conditionThreshold: {
          filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="volunteer-connect-backend-${$app.stage}" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"`,
          comparison: "COMPARISON_GT",
          thresholdValue: 0,
          duration: "60s", // Chờ 60s để gom cụm (chống Alert Fatigue)
          aggregations: [{
            alignmentPeriod: "60s",
            crossSeriesReducer: "REDUCE_SUM",
            perSeriesAligner: "ALIGN_RATE",
          }],
        },
      }],
      notificationChannels: [emailChannel.id],
      documentation: {
        content: "Hệ thống phát hiện lỗi 5xx tăng đột biến.\\n\\n👉 Mời xem Sổ tay Cứu thương (Runbook) tại: https://github.com/ZackVN04/VolunteerConnect/tree/main/docs/runbooks/alert_5xx.md",
        mimeType: "text/markdown",
      },
    });

    // 3. Bảng Điều Khiển (Dashboard) - Trực quan hóa dữ liệu
    const sreDashboard = new gcp.monitoring.Dashboard("SRE_Dashboard", {
      dashboardJson: JSON.stringify({
        displayName: "SRE Dashboard - VolunteerConnect",
        gridLayout: {
          columns: "2",
          widgets: [
            {
              title: "Lưu lượng truy cập (Traffic)",
              xyChart: {
                dataSets: [{
                  timeSeriesQuery: {
                    timeSeriesFilter: {
                      filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="volunteer-connect-backend-${$app.stage}" AND metric.type="run.googleapis.com/request_count"`,
                      aggregation: { perSeriesAligner: "ALIGN_RATE" }
                    }
                  }
                }]
              }
            },
            {
              title: "Độ trễ (Latency)",
              xyChart: {
                dataSets: [{
                  timeSeriesQuery: {
                    timeSeriesFilter: {
                      filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="volunteer-connect-backend-${$app.stage}" AND metric.type="run.googleapis.com/request_latencies"`,
                      aggregation: { perSeriesAligner: "ALIGN_PERCENTILE_99" }
                    }
                  }
                }]
              }
            }
          ]
        }
      })
    });

    // Tự động xuất ra đường link Web sau khi deploy thành công
    return {
      WebsiteURL: service.statuses.apply(s => s?.[0]?.url || "Đang khởi tạo..."),
    };
  },
});
