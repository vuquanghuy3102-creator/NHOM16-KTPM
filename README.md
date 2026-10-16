# Hotel Booking System

Website dat phong khach san phuc vu bai tap lon mon Kiem Thu Phan Mem.

## Cong nghe

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express.js
- Database: SQLite
- Authentication: JWT + bcryptjs
- API: REST/JSON

## Chuc nang nguoi dung

- Dang ky
- Dang nhap / dang xuat
- Xem danh sach khach san
- Tim kiem / loc khach san
- Xem chi tiet khach san
- Kiem tra phong trong
- Dat phong
- Huy phong
- Xem lich su dat phong
- Xem chi tiet booking
- Cap nhat thong tin ca nhan
- Doi mat khau

## Chuc nang quan tri

- Dang nhap bang tai khoan ADMIN
- Dashboard thong ke
- Them / xem / xoa khach san
- Them / xem / xoa phong
- Cap nhat trang thai phong
- Xem danh sach khach hang
- Xem danh sach booking
- Cap nhat trang thai booking

## Tai khoan mau

Customer:
- Email: user@hotel.test
- Password: User123!

Admin:
- Email: admin@hotel.test
- Password: Admin123!

## Cach chay

1. Cai Node.js LTS.
2. Mo thu muc project trong Visual Studio Code.
3. Mo Terminal.
4. Chay:

```bash
npm install
npm start
```

5. Mo:

```text
http://localhost:3000
```

## API quan trong

Authentication:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

Hotels:
- GET /api/hotels
- GET /api/hotels/search
- GET /api/hotels/:id
- GET /api/hotels/:id/rooms

Rooms:
- GET /api/rooms/search
- GET /api/rooms/:id
- GET /api/rooms/:id/availability

Bookings:
- POST /api/bookings
- GET /api/bookings/my-bookings
- GET /api/bookings/:id
- PUT /api/bookings/:id/cancel

Customer:
- GET /api/customers/profile
- PUT /api/customers/profile
- PUT /api/customers/change-password

Admin:
- POST /api/admin/login
- GET /api/admin/dashboard
- GET/POST /api/admin/hotels
- PUT/DELETE /api/admin/hotels/:id
- GET/POST /api/admin/rooms
- PUT/DELETE /api/admin/rooms/:id
- PUT /api/admin/rooms/:id/status
- GET /api/admin/customers
- GET /api/admin/customers/:id
- GET /api/admin/bookings
- PUT /api/admin/bookings/:id/status

## Ghi chu de kiem thu

Project co validation va status code co chu dich de phuc vu test case:

- 200: thanh cong
- 201: tao moi thanh cong
- 400: du lieu dau vao khong hop le
- 401: chua dang nhap / sai tai khoan
- 403: khong co quyen
- 404: khong tim thay tai nguyen
- 409: xung dot du lieu / dat trung lich

Database SQLite duoc tao tu dong tai `database/hotel_booking.db` khi server chay lan dau.

## Pangu UI update
- Brand renamed to Pangu.
- Vietnamese/English language toggle.
- Scrollable province/city suggestion picker.
- Dual min/max price range sliders.


## Dữ liệu khách sạn mẫu mới
Website có sẵn 8 khách sạn Pangu tại Hà Nội, Đà Nẵng, Huế, Khánh Hòa, TP. Hồ Chí Minh, Quảng Ninh và Lâm Đồng.
Mỗi khách sạn có tên, địa điểm, mô tả, từ khóa tìm kiếm và 3 mức phòng/giá khác nhau.
Tìm kiếm hỗ trợ đồng thời: Hotel name / keyword, tỉnh thành và khoảng giá Min-Max.

## Tương thích Node.js 24
Phiên bản này dùng `sql.js` thay cho package `sqlite3` native, tránh lỗi `Could not locate the bindings file` trên Node.js 24.
Sau khi giải nén bản mới, xóa `node_modules` cũ (nếu có), rồi chạy `npm.cmd install` và `npm.cmd start`.

