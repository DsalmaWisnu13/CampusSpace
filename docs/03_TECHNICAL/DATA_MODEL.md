# Data Model (TypeScript baseline)
```ts
type Role = "STUDENT" | "CDC" | "LECTURER";
type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
interface User { id:string; role:Role; campusSubjectId?:string; fullName?:string; publicPseudonym?:string; email?:string }
interface Course { id:string; code?:string; name:string; hashtag:string; lecturerId?:string }
interface CourseMeeting { id:string; courseId:string; meetingNumber:number; topic:string; date?:string; lecturerId?:string }
interface DiscussionPost { id:string; authorUserId:string; courseId:string; meetingId:string; title?:string; body:string; createdAt:string }
interface DiscussionReply { id:string; postId:string; authorUserId:string; body:string; createdAt:string }
interface LearningResource { id:string; courseId:string; meetingId?:string; title:string; description?:string; type:"PDF"|"SLIDE"|"VIDEO"|"LINK"|"OTHER"; url?:string; uploadedByLecturerId?:string }
interface Building { id:string; name:string }
interface Floor { id:string; buildingId:string; label:string; floorPlanAsset?:string }
interface Room { id:string; name:string; floorId:string; capacity?:number; facilities?:string[]; photoAsset?:string; mapRegion?:{x:number;y:number;width:number;height:number} }
interface AcademicSchedule { id:string; courseId:string; meetingId?:string; lecturerId:string; roomId:string; startsAt:string; endsAt:string; source:"DEMO"|"OFFICIAL_IMPORT"|"OFFICIAL_API" }
interface RoomBooking { id:string; roomId:string; requesterUserId:string; purpose:string; participantCount?:number; startsAt:string; endsAt:string; status:BookingStatus; rejectionReason?:string; decidedByUserId?:string; decidedAt?:string; createdAt:string }
interface AppNotification { id:string; recipientUserId:string; type:string; title:string; body:string; targetPath?:string; createdAt:string; readAt?:string }
interface TopicAcknowledgement { id:string; lecturerId:string; courseMeetingId:string; topicKey:string; status:"WILL_EXPLAIN"; createdAt:string }
```
Privacy: public author resolver hanya pseudonym; lecturer insight hanya course/meeting/topic/count tanpa student identifiers; CDC dapat identitas pada booking; mapRegion jangan diisi sebelum diverifikasi.
