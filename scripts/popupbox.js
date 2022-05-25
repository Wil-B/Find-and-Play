'use strict';

class PopUpBox {
	constructor() {
		this.getHtmlCode();
		this.ok = true;
	}

	// Methods

	getHtmlCode() {
		let cssPath = `${my_utils.packagePath}/assets/html/`;
		if (this.getWindowsVersion() === '6.1') {
			cssPath += 'styles7.css';
		} else {
			cssPath += 'styles10.css';
		}
		this.configHtmlCode = my_utils.getAsset('\\html\\config.html').replace(/href="styles10.css"/i, `href="${cssPath}"`);
		this.confirmHtmlCode = my_utils.getAsset('\\html\\confirm.html').replace(/href="styles10.css"/i, `href="${cssPath}"`);
		this.inputHtmlCode = my_utils.getAsset('\\html\\input.html').replace(/href="styles10.css"/i, `href="${cssPath}"`);
		this.messageHtmlCode = my_utils.getAsset('\\html\\messageBox.html').replace(/href="styles10.css"/i, `href="${cssPath}"`);
		this.queryHtmlCode = my_utils.getAsset('\\html\\query.html').replace(/href="styles10.css"/i, `href="${cssPath}"`);
	}

	getWindowsVersion() {
		let version = '';

		try {
			version = (WshShell.RegRead('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\CurrentMajorVersionNumber')).toString();
			version += '.';
			version += (WshShell.RegRead('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\CurrentMinorVersionNumber')).toString();
			return version;
		} catch (e) {}

		try {
			version = WshShell.RegRead('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\CurrentVersion');
			return version;
		} catch (e) {}
		return '6.1';
	}

	config(ppt, dialogWindow, ok_callback) {
		utils.ShowHtmlDialog(0, this.configHtmlCode, {
			data: [ppt, dialogWindow, window.IsTransparent, ok_callback, this.bias_callback, this.tf_callback],
			resizable: true
		});
	}

	confirm(msg_title, msg_content, btn_yes_label, btn_no_label, height_adjust, confirm_callback) {
		utils.ShowHtmlDialog(0, this.confirmHtmlCode, {
			data: [msg_title, msg_content, btn_yes_label, btn_no_label, height_adjust, confirm_callback]
		});
	}

	input(title, msg, ok_callback, input, def) {
		utils.ShowHtmlDialog(0, this.inputHtmlCode, {
			data: [title, msg, 'Cancel', ok_callback, input, def]
		});
	}

	query(title, msg, ok_callback, input, def) {
		utils.ShowHtmlDialog(0, this.queryHtmlCode, {
			data: [title, msg, 'Cancel', ok_callback, this.check_query_callback, input, def]
		});
	}

	message() {
		utils.ShowHtmlDialog(0, this.messageHtmlCode, {
			data: [this.window_ok_callback, $.scale],
		});
	}

	bias_callback() {
		return index.curDefBias();
	}

	check_query_callback(str) {
		let valid_query = true;
		try {
			fb.GetQueryItems(new FbMetadbHandleList(), str);
		} catch (e) {
			valid_query = false;
		}
		return valid_query;
	}

	window_ok_callback(status, clicked) {
		if (clicked) ppt.foo_youtubeNotInstalledMsg = false;
	}

	tf_callback(tf, type) {
		return panel.preview(tf, type);
	}
}