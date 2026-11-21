# API / Service Contract
Auth: getCurrentUser, demoSignIn, updateStudentPseudonym, signOut.
Discussion: listDiscussions(filters), getDiscussion, createDiscussion(STUDENT), replyToDiscussion(STUDENT), listReplies, getDiscussionAggregates(LECTURER; aggregate only).
Materials: listCourses, getCourse, listCourseMeetings, listResources, listMeetingDiscussionArchive.
Rooms: listBuildings, listFloors, listRooms, getRoom, getRoomSchedule.
Booking: createBooking(STUDENT), listMyBookings(STUDENT), listPendingBookings(CDC), getBookingForCdc(CDC), approveBooking(CDC + conflict check), rejectBooking(CDC + reason).
CDC schedule: listWeeklyRoomSchedule, create/updateAcademicSchedule(authorized operator), checkRoomConflict.
Lecturer: getLecturerTodaySchedule, getLecturerDiscussionInsights(aggregate only), acknowledgeTopic.
Notifications: listNotifications, markNotificationRead, markAllNotificationsRead.
Error codes: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, ROOM_CONFLICT, UNKNOWN.
Invariants: student tidak approve/reject; lecturer tidak create/reply atau fetch identity; CDC identity access hanya booking; jadwal resmi hanya petugas berwenang.
