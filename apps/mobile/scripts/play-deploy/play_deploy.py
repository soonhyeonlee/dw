#!/usr/bin/env python3
"""
더블원플러스 — Google Play 자동 업로드 (Play Developer API)

서비스 계정 JSON 키로 AAB 를 지정한 트랙(internal/beta/production)에 올린다.
Expo/Ruby/fastlane 불필요. 명령 한 줄.

사용법:
    python play_deploy.py                          # 기본: internal 트랙, 기본 AAB 경로
    python play_deploy.py --track production        # 프로덕션 출시
    python play_deploy.py --aab path/to.aab --notes "버그 수정"
    python play_deploy.py --status draft            # 출시 보류(콘솔에서 수동 출시)

환경변수로도 키 경로 지정 가능: PLAY_SA_KEY=...play-service-account.json

⚠️ Play Developer API 는 '앱의 첫 버전'은 업로드할 수 없습니다.
   첫 출시 1회는 반드시 콘솔에서 수동 업로드(apps/mobile/_store/ 자료 사용).
   이후 모든 업데이트는 이 스크립트로 자동화됩니다.
"""
import argparse
import os
import sys

# Windows 콘솔에서도 한글이 깨지지 않도록 UTF-8 출력 강제
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from googleapiclient.errors import HttpError
except ImportError:
    sys.exit("의존성 누락. 먼저:  pip install -r requirements.txt")

PACKAGE = "com.doublewin.app"
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]
HERE = os.path.dirname(os.path.abspath(__file__))
MOBILE = os.path.abspath(os.path.join(HERE, "..", ".."))
DEFAULT_AAB = os.path.join(MOBILE, "android", "app", "build", "outputs", "bundle", "release", "app-release.aab")
DEFAULT_KEY = os.environ.get("PLAY_SA_KEY", os.path.join(MOBILE, "_secrets", "play-service-account.json"))


def main():
    ap = argparse.ArgumentParser(description="Upload AAB to Google Play")
    ap.add_argument("--key", default=DEFAULT_KEY, help="서비스 계정 JSON 키 경로")
    ap.add_argument("--aab", default=DEFAULT_AAB, help="AAB 파일 경로")
    ap.add_argument("--package", default=PACKAGE)
    ap.add_argument("--track", default="internal",
                    choices=["internal", "alpha", "beta", "production"],
                    help="출시 트랙 (기본 internal=내부테스트)")
    ap.add_argument("--status", default="completed",
                    choices=["completed", "draft", "inProgress", "halted"],
                    help="completed=즉시출시, draft=콘솔에서 수동출시")
    ap.add_argument("--notes", default="", help="출시 노트(ko-KR)")
    ap.add_argument("--rollout", type=float, default=None,
                    help="단계적 출시 비율 0~1 (inProgress 일 때, 예: 0.1=10%%)")
    args = ap.parse_args()

    if not os.path.isfile(args.key):
        sys.exit(f"❌ 서비스 계정 키 없음: {args.key}\n   README.md 의 '1회 설정'을 먼저 진행하세요.")
    if not os.path.isfile(args.aab):
        sys.exit(f"❌ AAB 없음: {args.aab}\n   먼저 빌드:  cd android && ./gradlew.bat bundleRelease")

    print(f"• 패키지 : {args.package}")
    print(f"• AAB    : {args.aab}  ({os.path.getsize(args.aab)/1e6:.1f} MB)")
    print(f"• 트랙   : {args.track}  (status={args.status})")
    print(f"• 키     : {args.key}")

    creds = service_account.Credentials.from_service_account_file(args.key, scopes=SCOPES)
    svc = build("androidpublisher", "v3", credentials=creds, cache_discovery=False)
    edits = svc.edits()

    try:
        edit_id = edits.insert(packageName=args.package, body={}).execute()["id"]
        print(f"• edit   : {edit_id}")

        media = MediaFileUpload(args.aab, mimetype="application/octet-stream", resumable=True)
        print("• 업로드 중...")
        bundle = edits.bundles().upload(
            packageName=args.package, editId=edit_id, media_body=media
        ).execute()
        version_code = bundle["versionCode"]
        print(f"• versionCode {version_code} 업로드 완료")

        release = {
            "name": f"{version_code} (auto)",
            "versionCodes": [version_code],
            "status": args.status,
        }
        if args.notes:
            release["releaseNotes"] = [{"language": "ko-KR", "text": args.notes}]
        if args.status == "inProgress" and args.rollout:
            release["userFraction"] = args.rollout

        edits.tracks().update(
            packageName=args.package, editId=edit_id, track=args.track,
            body={"track": args.track, "releases": [release]},
        ).execute()
        print(f"• {args.track} 트랙에 배정")

        edits.commit(packageName=args.package, editId=edit_id).execute()
        print(f"\n✅ 완료. Play 콘솔에서 검토 상태 확인:")
        print(f"   https://play.google.com/console  →  출시 → {args.track}")
        print(f"   게시 후 공개 페이지: https://play.google.com/store/apps/details?id={args.package}")

    except HttpError as e:
        msg = e.content.decode("utf-8", "ignore") if hasattr(e, "content") else str(e)
        print(f"\n❌ Play API 오류:\n{msg}", file=sys.stderr)
        if "Only releases with status draft may be created on draft app" in msg or "first" in msg.lower():
            print("\n💡 아직 첫 출시 전인 앱입니다. 첫 버전은 콘솔에서 수동 업로드해야 합니다.\n"
                  "   apps/mobile/_store/ 자료로 1회 출시 후 다시 시도하세요.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
