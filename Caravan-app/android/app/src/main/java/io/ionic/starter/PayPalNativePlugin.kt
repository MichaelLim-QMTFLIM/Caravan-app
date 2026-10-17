package io.ionic.starter

import android.content.Intent
import android.content.ActivityNotFoundException
import android.net.Uri
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.paypal.android.corepayments.CoreConfig
import com.paypal.android.corepayments.CoreEnvironment
import com.paypal.android.corepayments.model.TokenType
import com.paypal.android.paypalpayments.PayPalClient
import com.paypal.android.paypalpayments.PayPalFinishStartResult
import com.paypal.android.paypalpayments.PayPalPresentAuthChallengeResult
import com.paypal.android.paypalpayments.PayPalResultCallback
import com.paypal.android.paypalpayments.PayPalUserAction
import com.paypal.android.paypalpayments.PayPalUserIdentity
import com.paypal.android.paypalpayments.ReturnToAppUrlConfig

@CapacitorPlugin(name = "PayPalNative")
class PayPalNativePlugin : Plugin() {
    private var checkoutClient: PayPalClient? = null
    private var pendingCheckoutCall: PluginCall? = null
    private var returnUrlConfig: ReturnToAppUrlConfig? = null

    @PluginMethod
    fun openApprovalInChrome(call: PluginCall) {
        val approvalUrl = call.getString("url")?.trim().orEmpty()
        val uri = runCatching { Uri.parse(approvalUrl) }.getOrNull()
        if (uri == null || uri.scheme != "https" || uri.host !in setOf("www.paypal.com", "www.sandbox.paypal.com", "paypal.com", "sandbox.paypal.com")) {
            call.reject("PayPal returned an invalid approval URL")
            return
        }

        try {
            val chromeIntent = Intent(Intent.ACTION_VIEW, uri).setPackage("com.android.chrome")
            try {
                activity.startActivity(chromeIntent)
            } catch (_: ActivityNotFoundException) {
                activity.startActivity(Intent(Intent.ACTION_VIEW, uri))
            }
            call.resolve()
        } catch (error: Exception) {
            call.reject("Unable to open PayPal in a browser", error)
        }
    }

    @PluginMethod
    fun initialize(call: PluginCall) {
        val clientId = call.getString("clientId")?.trim().orEmpty()
        val merchantId = call.getString("merchantId")?.trim().orEmpty()
        val environment = call.getString("environment", "sandbox")
        if (clientId.isBlank() || merchantId.isBlank()) {
            call.reject("PayPal client ID and merchant ID must be configured on the server")
            return
        }

        val coreEnvironment = if (environment.equals("live", ignoreCase = true)) {
            CoreEnvironment.LIVE
        } else {
            CoreEnvironment.SANDBOX
        }
        checkoutClient = PayPalClient(
            context = context,
            configuration = CoreConfig(
                clientId = clientId,
                merchantId = merchantId,
                coreEnvironment = coreEnvironment
            )
        )
        returnUrlConfig = ReturnToAppUrlConfig(
            returnAppUrl = "",
            cancelAppUrl = "",
            fallbackSchemeUrl = "caravan://paypal-return"
        )
        call.resolve()
    }

    @PluginMethod
    fun createPayPalSession(call: PluginCall) {
        val client = checkoutClient
        val urls = returnUrlConfig
        if (client == null || urls == null) {
            call.reject("PayPal is not initialized")
            return
        }

        val email = call.getString("email")?.trim()?.takeIf { it.isNotEmpty() }
        try {
            client.createPayPalSession(
                tokenType = TokenType.ORDER_ID,
                userIdentity = email?.let { PayPalUserIdentity(email = it) },
                urlConfig = urls,
                userAction = PayPalUserAction.CONTINUE
            )
            call.resolve()
        } catch (error: Exception) {
            call.reject("Unable to prepare PayPal checkout", error)
        }
    }

    @PluginMethod
    fun startCheckout(call: PluginCall) {
        val client = checkoutClient
        val orderId = call.getString("orderId")?.trim().orEmpty()
        if (client == null || orderId.isBlank()) {
            call.reject("PayPal is not initialized or the order ID is missing")
            return
        }
        if (pendingCheckoutCall != null) {
            call.reject("A PayPal checkout is already in progress")
            return
        }

        pendingCheckoutCall = call
        bridge.saveCall(call)
        try {
            client.start(activity, orderId, object : PayPalResultCallback {
                override fun onPayPalResult(result: PayPalPresentAuthChallengeResult) {
                    if (result is PayPalPresentAuthChallengeResult.Failure) {
                        finishPendingCall("failed", result.error.toString())
                    }
                    // Success means the PayPal app or browser opened. The actual result
                    // is returned later through handleOnNewIntent()/finishStart().
                }
            })
        } catch (error: Exception) {
            finishPendingCall("failed", error.message ?: "Unable to open PayPal checkout")
        }
    }

    override fun handleOnNewIntent(intent: Intent) {
        super.handleOnNewIntent(intent)
        val client = checkoutClient ?: return
        when (val result = client.finishStart(intent)) {
            is PayPalFinishStartResult.Success -> finishPendingCall("approved", null, result.orderId)
            is PayPalFinishStartResult.Canceled -> finishPendingCall("cancelled", null, result.orderId)
            is PayPalFinishStartResult.Failure -> finishPendingCall("failed", result.error.toString(), result.orderId)
            PayPalFinishStartResult.NoResult, null -> Unit
        }
    }

    private fun finishPendingCall(status: String, message: String?, orderId: String? = null) {
        val call = pendingCheckoutCall ?: return
        pendingCheckoutCall = null
        val result = JSObject()
        result.put("status", status)
        if (message != null) result.put("message", message)
        if (orderId != null) result.put("orderId", orderId)
        call.resolve(result)
        bridge.releaseCall(call)
    }
}
