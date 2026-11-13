import UIKit
import Capacitor
import UserNotifications

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = MainViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    // Opening the app clears the number on its icon. Asks for no permission:
    // without notification permission there's no number to clear.
    func sceneDidBecomeActive(_ scene: UIScene) {
        if #available(iOS 16.0, *) {
            UNUserNotificationCenter.current().setBadgeCount(0) { _ in }
        } else {
            UIApplication.shared.applicationIconBadgeNumber = 0
        }
    }
}

// The app's web view, with Maidenhead's own native plugin added.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(DeviceIdPlugin())
    }
}

// A lasting id for this iPhone (src/mobile/lib/pushSubscribe.js). Deleting
// and reinstalling the app gives it a new notification address; with this id
// the push list replaces the phone's old address instead of counting the
// phone twice. Kept in the Keychain, which outlives the app being deleted;
// "this device only" so a new phone restored from a backup gets its own.
@objc(DeviceIdPlugin)
public class DeviceIdPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DeviceIdPlugin"
    public let jsName = "DeviceId"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise)
    ]

    private static let service = "com.maidenheadapp.device-id"

    @objc func get(_ call: CAPPluginCall) {
        call.resolve(["id": DeviceIdPlugin.value() ?? NSNull()])
    }

    static func value() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "id",
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var item: CFTypeRef?
        if SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
           let data = item as? Data, let saved = String(data: data, encoding: .utf8), !saved.isEmpty {
            return saved
        }
        let made = "i-" + UUID().uuidString.lowercased()
        let add: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "id",
            kSecValueData as String: Data(made.utf8),
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        return SecItemAdd(add as CFDictionary, nil) == errSecSuccess ? made : nil
    }
}
